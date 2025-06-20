import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
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
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="app-container">
      <!-- Toolbar -->
      <p-toolbar>
        <div class="p-toolbar-group-start">
          <p-button
            icon="pi pi-folder-open"
            label="Open PDF"
            (click)="openPdf()"
            [disabled]="pdfService.isLoading()"
            class="p-button-outlined mr-2"
          >
          </p-button>

          @if (!isElectron) {
          <p-fileUpload
            mode="basic"
            accept=".pdf"
            chooseLabel="Upload PDF"
            (onSelect)="onFileSelect($event)"
            [disabled]="pdfService.isLoading()"
            class="p-button-outlined mr-2"
          >
          </p-fileUpload>
          }

          <p-button
            icon="pi pi-save"
            label="Save PDF"
            (click)="savePdf()"
            [disabled]="!pdfService.currentFileName() || pdfService.isLoading()"
            class="p-button-outlined mr-2"
          >
          </p-button>

          <p-button
            icon="pi pi-copy"
            label="Split PDF"
            (click)="showSplitDialog = true"
            [disabled]="pdfService.pages().length === 0"
            class="p-button-outlined mr-2"
          >
          </p-button>
        </div>

        <div class="p-toolbar-group-end">
          @if (pdfService.currentFileName()) {
          <span class="font-medium">{{ pdfService.currentFileName() }}</span>
          @if (pdfService.hasChanges()) {
          <p-badge value="*" severity="warn" class="ml-2"></p-badge>
          } }
        </div>
      </p-toolbar>

      <!-- Loading spinner -->
      @if (pdfService.isLoading()) {
      <div class="loading-container">
        <p-progressSpinner></p-progressSpinner>
        <p>Loading PDF...</p>
      </div>
      }

      <!-- PDF Pages Grid -->
      @if (pdfService.pages().length > 0 && !pdfService.isLoading()) {
      <div class="pages-container">
        <div class="pages-grid">
          @for (page of pdfService.pages(); track page.pageNumber) {
          <div
            class="page-card"
            pDraggable="pages"
            pDroppable="pages"
            (onDrop)="onPageDrop($event, $index)"
            (onDragStart)="draggedPageIndex = $index"
            (onDragEnd)="draggedPageIndex = null"
          >
            <p-card>
              <ng-template pTemplate="header">
                <div class="page-header">
                  <span class="page-number">Page {{ $index + 1 }}</span>
                  <div class="page-actions">
                    <p-button
                      icon="pi pi-copy"
                      size="small"
                      (click)="duplicatePage($index)"
                      class="p-button-rounded p-button-text p-button-sm"
                    >
                    </p-button>
                    <p-button
                      icon="pi pi-trash"
                      size="small"
                      (click)="deletePage($index)"
                      class="p-button-rounded p-button-text p-button-danger p-button-sm"
                    >
                    </p-button>
                  </div>
                </div>
              </ng-template>

              <div class="page-content">
                <canvas
                  [attr.width]="page.width"
                  [attr.height]="page.height"
                  #canvas
                ></canvas>
              </div>
            </p-card>
          </div>
          }
        </div>
      </div>
      }

      <!-- Empty state -->
      @if (pdfService.pages().length === 0 && !pdfService.isLoading()) {
      <div class="empty-state">
        <div class="empty-content">
          <i
            class="pi pi-file-pdf"
            style="font-size: 4rem; color: #6c757d;"
          ></i>
          <h3>No PDF loaded</h3>
          <p>Open a PDF file to start organizing pages</p>
          <p-button
            label="Open PDF"
            icon="pi pi-folder-open"
            (click)="openPdf()"
            class="p-button-lg"
          >
          </p-button>
        </div>
      </div>
      }

      <!-- Split PDF Dialog -->
      <p-dialog
        header="Split PDF"
        [(visible)]="showSplitDialog"
        [modal]="true"
        [responsive]="true"
        [style]="{ width: '50vw' }"
        [breakpoints]="{ '960px': '75vw', '640px': '90vw' }"
      >
        <div class="split-dialog-content">
          <p>
            Select save location and enter page ranges to split the PDF into
            separate files:
          </p>

          <!-- Save Location Selector -->
          <div class="save-location-section">
            <label for="save-location" class="block text-sm font-medium mb-2"
              >Save Location:</label
            >
            <div class="flex gap-2">
              <p-iconfield class="flex-1">
                <p-inputicon styleClass="pi pi-folder" />
                <input
                  id="save-location"
                  type="text"
                  pInputText
                  [(ngModel)]="splitSaveLocation"
                  placeholder="Select folder to save split PDFs..."
                  class="w-full"
                  readonly
                />
              </p-iconfield>
              <p-button
                icon="pi pi-folder-open"
                (click)="selectSaveLocation()"
                class="p-button-outlined"
                [disabled]="!isElectron"
              >
              </p-button>
            </div>
            @if (!splitSaveLocation) {
            <small class="text-orange-600"
              >Please select a save location before splitting the PDF.</small
            >
            }
          </div>

          @for (range of splitRanges; track $index) {
          <div class="split-range-item">
            <div class="p-inputgroup">
              <span class="p-inputgroup-addon">Pages</span>
              <input
                type="number"
                pInputText
                placeholder="Start"
                [(ngModel)]="range.start"
                min="0"
                [max]="pdfService.pages().length"
              />
              <span class="p-inputgroup-addon">to</span>
              <input
                type="number"
                pInputText
                placeholder="End"
                [(ngModel)]="range.end"
                min="1"
                [max]="pdfService.pages().length"
              />
              <span class="p-inputgroup-addon">File:</span>
              <input
                type="text"
                pInputText
                placeholder="filename.pdf"
                [(ngModel)]="range.filename"
              />
              <p-button
                icon="pi pi-trash"
                (click)="removeSplitRange($index)"
                class="p-button-danger"
              >
              </p-button>
            </div>
          </div>
          }

          <p-button
            label="Add Range"
            icon="pi pi-plus"
            (click)="addSplitRange()"
            class="p-button-outlined"
          >
          </p-button>
        </div>

        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            (click)="showSplitDialog = false"
            class="p-button-text"
          >
          </p-button>
          <p-button
            label="Split PDF"
            icon="pi pi-check"
            (click)="executeSplit()"
            [disabled]="
              splitRanges.length === 0 || (isElectron && !splitSaveLocation)
            "
          >
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- Toast messages -->
      <p-toast></p-toast>

      <!-- Confirmation dialog -->
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [
    `
      .app-container {
        height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        gap: 1rem;
      }

      .pages-container {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
      }

      .pages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
      }

      .page-card {
        cursor: move;
        transition: transform 0.2s;
      }

      .page-card:hover {
        transform: translateY(-2px);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background-color: #f8f9fa;
      }

      .page-number {
        font-weight: 600;
      }

      .page-actions {
        display: flex;
        gap: 0.25rem;
      }

      .page-content {
        padding: 1rem;
        display: flex;
        justify-content: center;
      }

      .page-content canvas {
        max-width: 100%;
        height: auto;
        border: 1px solid #dee2e6;
        border-radius: 4px;
      }

      .empty-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-content {
        text-align: center;
        color: #6c757d;
      }

      .split-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .split-range-item {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .p-inputgroup {
        display: flex;
        align-items: center;
        width: 100%;
      }

      .p-inputgroup input {
        flex: 1;
      }

      .save-location-section {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #dee2e6;
      }

      .save-location-section label {
        color: #495057;
        font-weight: 500;
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
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
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this page?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.pdfService.removePage(index);
        setTimeout(() => this.renderCanvases(), 100);
      },
    });
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
