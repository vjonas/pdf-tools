import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfService } from './services/pdf.service';

// PrimeNG imports
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DragDropModule } from 'primeng/dragdrop';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    FileUploadModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    DragDropModule,
    CardModule,
    BadgeModule,
    IconFieldModule,
    InputIconModule,
    HttpClientModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked
{
  pdfService = inject(PdfService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);

  isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  showSplitDialog = false;
  draggedPageIndex: number | null = null;

  splitRanges: { start: number; end: number; filename: string }[] = [
    { start: 1, end: 1, filename: 'part1.pdf' },
  ];

  splitSaveLocation = '';

  private readonly SPLIT_SAVE_LOCATION_KEY =
    'pdf-organiser-split-save-location';

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Setup canvas rendering after view init
    setTimeout(() => this.renderCanvases(), 100);

    // Load saved split location
    this.loadSplitSaveLocation();
  }
  ngAfterViewInit(): void {
    this.renderCanvases();
    // Signal to Electron that Angular is ready
    if (this.isElectron && window.electronAPI) {
      // Wait a bit for Angular to fully initialize
      setTimeout(() => {
        window.electronAPI.signalAngularReady();
      }, 500);
    }
  }

  ngAfterViewChecked(): void {
    this.renderCanvases();
    console.log('ngAfterViewChecked');
  }

  ngOnDestroy(): void {
    if (this.isElectron && window.electronAPI) {
      window.electronAPI.removeAllListeners('file-opened');
      window.electronAPI.removeAllListeners('save-pdf');
    }
  }

  async openPdf(): Promise<void> {
    try {
      await this.pdfService.openPdf();
      setTimeout(() => this.renderCanvases(), 100);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to open PDF file',
      });
    }
  }

  async onFileSelect(event: any): Promise<void> {
    const file = event.files[0];
    if (file) {
      try {
        await this.pdfService.loadPdfFromFile(file);
        setTimeout(() => this.renderCanvases(), 100);
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load PDF file',
        });
      }
    }
  }

  async savePdf(): Promise<void> {
    try {
      await this.pdfService.savePdf();
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'PDF saved successfully',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save PDF',
      });
    }
  }

  onPageDrop(event: any, targetIndex: number): void {
    if (
      this.draggedPageIndex !== null &&
      this.draggedPageIndex !== targetIndex
    ) {
      this.pdfService.reorderPages(this.draggedPageIndex, targetIndex);
      setTimeout(() => this.renderCanvases(), 100);
    }
    this.draggedPageIndex = null;
  }

  duplicatePage(index: number): void {
    this.pdfService.duplicatePage(index);
    setTimeout(() => this.renderCanvases(), 100);
  }

  deletePage(index: number): void {
    this.pdfService.removePage(index);
    setTimeout(() => this.renderCanvases(), 100);
    // this.confirmationService.confirm({
    //   message: 'Are you sure you want to delete this page?',
    //   header: 'Confirm Delete',
    //   icon: 'pi pi-exclamation-triangle',
    //   accept: () => {
    //     this.pdfService.removePage(index);
    //     setTimeout(() => this.renderCanvases(), 100);
    //   },
    // });
  }

  addSplitRange(): void {
    this.splitRanges.push({
      start: 1,
      end: this.pdfService.pages().length,
      filename: `part${this.splitRanges.length + 1}.pdf`,
    });
  }

  removeSplitRange(index: number): void {
    this.splitRanges.splice(index, 1);
  }

  async executeSplit(): Promise<void> {
    try {
      await this.pdfService.splitPdf(this.splitRanges, this.splitSaveLocation);
      this.showSplitDialog = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'PDF split successfully',
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to split PDF',
      });
    }
  }

  private renderCanvases(): void {
    const pages = this.pdfService.pages();
    const canvasElements = document.querySelectorAll('.page-content canvas');

    canvasElements.forEach((canvas, index) => {
      if (pages[index] && canvas instanceof HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(pages[index].canvas, 0, 0);
        }
      }
    });
  }

  private loadSplitSaveLocation(): void {
    const saved = localStorage.getItem(this.SPLIT_SAVE_LOCATION_KEY);
    if (saved) {
      this.splitSaveLocation = saved;
    }
  }

  private saveSplitSaveLocation(): void {
    localStorage.setItem(this.SPLIT_SAVE_LOCATION_KEY, this.splitSaveLocation);
  }

  async selectSaveLocation(): Promise<void> {
    if (this.isElectron && window.electronAPI) {
      try {
        const result = await window.electronAPI.showDirectoryDialog();
        if (!result.canceled && result.filePaths.length > 0) {
          this.splitSaveLocation = result.filePaths[0];
          this.saveSplitSaveLocation();
        }
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to select directory',
        });
      }
    }
  }
}
