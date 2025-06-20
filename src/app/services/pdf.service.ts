import { Injectable, signal } from '@angular/core';
import { PDFDocument, PDFPage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for Electron compatibility
const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

// Detect if running in packaged Electron app
const isPackagedElectron =
  isElectron &&
  typeof window !== 'undefined' &&
  window.location.protocol === 'file:';

if (isElectron) {
  if (isPackagedElectron) {
    // For packaged Electron apps, use relative path to bundled worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf-worker/pdf.worker.min.js';
  } else {
    // For Electron development, disable workers to avoid CSP issues (fallback to main thread)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.js';
  }
} else {
  // For web browsers, use absolute path to worker file
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.js';
}

export interface PdfPageInfo {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  originalIndex: number;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private currentPdfDoc: PDFDocument | null = null;
  private currentPdfJsDoc: pdfjsLib.PDFDocumentProxy | null = null;
  private currentFilePath: string | null = null;

  // Signals for reactive state management
  pages = signal<PdfPageInfo[]>([]);
  isLoading = signal(false);
  currentFileName = signal<string | null>(null);
  hasChanges = signal(false);

  private log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] PDF Service: ${message}`;

    // Log to browser console
    if (data) {
      console.log(logEntry, data);
    } else {
      console.log(logEntry);
    }

    // Also log to Electron main process if available
    if (typeof window !== 'undefined' && window.electronAPI?.log) {
      window.electronAPI.log('info', message, data);
    }
  }

  constructor() {
    // Set up Electron API listeners if in Electron environment
    this.log('PDF service constructor', { electronAPI: !!window.electronAPI });
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onFileOpened((event, filePath) => {
        this.log('File opened event received', { filePath });
        this.loadPdf(filePath);
      });

      window.electronAPI.onSavePdf(() => {
        this.log('Save PDF event received');
        this.savePdf();
      });
    }
  }

  async loadPdf(filePath: string): Promise<void> {
    this.isLoading.set(true);
    try {
      let pdfBuffer: ArrayBuffer;
      this.log('Loading PDF from file path', {
        filePath,
        hasElectronAPI: !!window.electronAPI,
      });

      if (window.electronAPI) {
        // Electron environment - read file via IPC
        const buffer = await window.electronAPI.readPdfFile(filePath);
        pdfBuffer = buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        );
      } else {
        // Web environment - use file input
        const response = await fetch(filePath);
        pdfBuffer = await response.arrayBuffer();
      }

      // Load with PDF-lib for manipulation
      this.currentPdfDoc = await PDFDocument.load(pdfBuffer);

      // Load with PDF.js for rendering
      this.currentPdfJsDoc = await pdfjsLib.getDocument({ data: pdfBuffer })
        .promise;

      this.currentFilePath = filePath;
      this.currentFileName.set(filePath.split('/').pop() || 'document.pdf');

      await this.renderAllPages();
      this.hasChanges.set(false);
    } catch (error) {
      this.log('Error loading PDF', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPdfFromFile(file: File): Promise<void> {
    this.isLoading.set(true);
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Load with PDF-lib for manipulation
      this.currentPdfDoc = await PDFDocument.load(arrayBuffer);

      // Load with PDF.js for rendering
      this.currentPdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer })
        .promise;

      this.currentFilePath = null;
      this.currentFileName.set(file.name);

      await this.renderAllPages();
      this.hasChanges.set(false);
    } catch (error) {
      console.error('Error loading PDF from file:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  private async renderAllPages(): Promise<void> {
    if (!this.currentPdfJsDoc) return;

    const numPages = this.currentPdfJsDoc.numPages;
    const pagePromises: Promise<PdfPageInfo>[] = [];

    for (let i = 1; i <= numPages; i++) {
      pagePromises.push(this.renderPage(i));
    }

    const renderedPages = await Promise.all(pagePromises);
    this.pages.set(renderedPages);
  }

  private async renderPage(pageNum: number): Promise<PdfPageInfo> {
    if (!this.currentPdfJsDoc) throw new Error('No PDF document loaded');

    const page = await this.currentPdfJsDoc.getPage(pageNum);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport,
    });

    await renderTask.promise;

    return {
      pageNumber: pageNum,
      canvas: canvas,
      originalIndex: pageNum - 1,
      width: viewport.width,
      height: viewport.height,
    };
  }

  reorderPages(fromIndex: number, toIndex: number): void {
    const currentPages = this.pages();
    const updatedPages = [...currentPages];
    const [movedPage] = updatedPages.splice(fromIndex, 1);
    updatedPages.splice(toIndex, 0, movedPage);

    this.pages.set(updatedPages);
    this.hasChanges.set(true);
  }

  removePage(index: number): void {
    const currentPages = this.pages();
    const updatedPages = currentPages.filter((_, i) => i !== index);
    this.pages.set(updatedPages);
    this.hasChanges.set(true);
  }

  duplicatePage(index: number): void {
    const currentPages = this.pages();
    const pageToDuplicate = currentPages[index];
    const duplicatedPage = { ...pageToDuplicate };
    const updatedPages = [...currentPages];
    updatedPages.splice(index + 1, 0, duplicatedPage);
    this.pages.set(updatedPages);
    this.hasChanges.set(true);
  }

  async savePdf(filePath?: string): Promise<void> {
    if (!this.currentPdfDoc) throw new Error('No PDF document loaded');

    try {
      // Create new PDF document with reordered pages
      const newPdfDoc = await PDFDocument.create();
      const currentPages = this.pages();

      for (const pageInfo of currentPages) {
        const [copiedPage] = await newPdfDoc.copyPages(this.currentPdfDoc, [
          pageInfo.originalIndex,
        ]);
        newPdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await newPdfDoc.save();

      if (window.electronAPI) {
        let saveFilePath = filePath;
        if (!saveFilePath) {
          const result = await window.electronAPI.showSaveDialog();
          if (result.canceled || !result.filePath) return;
          saveFilePath = result.filePath;
        }

        await window.electronAPI.savePdfFile(saveFilePath, pdfBytes);
        this.hasChanges.set(false);
      } else {
        // Web environment - download file
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath || this.currentFileName() || 'document.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.hasChanges.set(false);
      }
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
  }

  async splitPdf(
    pageRanges: { start: number; end: number; filename: string }[],
    saveLocation?: string
  ): Promise<void> {
    if (!this.currentPdfDoc) throw new Error('No PDF document loaded');

    try {
      for (const range of pageRanges) {
        const newPdfDoc = await PDFDocument.create();
        const currentPages = this.pages();

        // -1 because the first page is on index 0
        for (let i = range.start - 1; i <= range.end - 1; i++) {
          if (i < currentPages.length) {
            const [copiedPage] = await newPdfDoc.copyPages(this.currentPdfDoc, [
              currentPages[i].originalIndex,
            ]);
            newPdfDoc.addPage(copiedPage);
          }
        }

        const pdfBytes = await newPdfDoc.save();

        if (window.electronAPI) {
          // Combine save location with filename for full path
          const fullPath = saveLocation
            ? `${saveLocation}/${range.filename}`
            : range.filename;
          await window.electronAPI.savePdfFile(fullPath, pdfBytes);
        } else {
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = range.filename;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Error splitting PDF:', error);
      throw error;
    }
  }

  async openPdf(): Promise<void> {
    if (window.electronAPI) {
      const result = await window.electronAPI.showOpenDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        await this.loadPdf(result.filePaths[0]);
      }
    }
  }

  reset(): void {
    this.currentPdfDoc = null;
    this.currentPdfJsDoc = null;
    this.currentFilePath = null;
    this.pages.set([]);
    this.currentFileName.set(null);
    this.hasChanges.set(false);
  }
}
