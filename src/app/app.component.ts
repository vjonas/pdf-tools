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
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { HttpClientModule } from '@angular/common/http';

// Angular CDK Drag Drop imports
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

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
    CardModule,
    BadgeModule,
    IconFieldModule,
    InputIconModule,
    HttpClientModule,
    // Angular CDK Drag Drop
    CdkDrag,
    CdkDropList,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="app-container">
      <!-- Toolbar -->
      <p-toolbar>
        <div class="p-toolbar-group-start flex gap-1">
          <p-button
            icon="pi pi-folder-open"
            label="Open PDF"
            (click)="openPdf()"
            [disabled]="pdfService.isLoading()"
            class="p-button-outlined mr-2"
          >
          </p-button>

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

        <div class="p-toolbar-group-end justify-self-end">
          @if (pdfService.currentFileName()) {
          <span class="font-medium"
            >file: {{ pdfService.currentFileName() }}</span
          >
          @if (pdfService.hasChanges()) {
          <p-badge value="*" severity="warn" class="ml-2"></p-badge>
          } }
        </div>
        @if (!isElectron) {
        <p-fileUpload
          mode="basic"
          accept=".pdf"
          chooseLabel="Upload PDF"
          (onSelect)="onFileSelect($event)"
          [disabled]="pdfService.isLoading()"
          class="p-button-outlined mr-2  justify-self-start"
        >
        </p-fileUpload>
        }
      </p-toolbar>

      <!-- Loading spinner -->
      @if (pdfService.isLoading()) {
      <div class="loading-container">
        <p-progressSpinner></p-progressSpinner>
        <p>Loading PDF...</p>
      </div>
      }

      <!-- PDF Pages Grid with CDK Drag Drop -->
      @if (pdfService.pages().length > 0 && !pdfService.isLoading()) {
      <div class="pages-container">
        <div 
          class="pages-grid"
          cdkDropList
          [cdkDropListData]="pdfService.pages()"
          (cdkDropListDropped)="onPageDrop($event)"
          cdkDropListOrientation="mixed"
        >
          @for (page of pdfService.pages(); track page.pageNumber) {
          <div
            class="page-card"
            cdkDrag
            [cdkDragData]="{ page: page, index: $index }"
          >
            <!-- Custom drag preview -->
            <div class="page-drag-preview" *cdkDragPreview>
              <p-card class="drag-preview-card">
                <ng-template pTemplate="header">
                  <div class="page-header">
                    <span class="page-number">Page {{ $index + 1 }}</span>
                  </div>
                </ng-template>
                <div class="page-content preview-content">
                  <canvas
                    [attr.width]="page.width * 0.5"
                    [attr.height]="page.height * 0.5"
                    #previewCanvas
                  ></canvas>
                </div>
              </p-card>
            </div>

            <!-- Placeholder shown in the original position while dragging -->
            <div class="page-placeholder" *cdkDragPlaceholder>
              <div class="placeholder-content">
                <i class="pi pi-arrows-alt placeholder-icon"></i>
                <span class="placeholder-text">Drop page here</span>
              </div>
            </div>

            <!-- Actual page card -->
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
                      severity="danger"
                      size="small"
                      (click)="deletePage($index)"
                      class="p-button-rounded  p-button-text p-button-danger p-button-sm"
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
          <div class="split-range-item ">
            <div class="p-inputgroup gap-2">
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
              <span class="p-inputgroup-addon">Filename</span>
              <input
                type="text"
                pInputText
                placeholder="filename.pdf"
                [(ngModel)]="range.filename"
              />
              <p-button
                icon="pi pi-trash"
                severity="danger"
                (click)="removeSplitRange($index)"
                class=" p-button-outlined p-button-rounded"
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
            severity="secondary"
            text
            icon="pi pi-times"
            (click)="showSplitDialog = false"
            class="p-button-outlined"
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

  // Updated drag drop handler using CDK
  onPageDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      // Reorder pages in the service
      this.pdfService.reorderPages(event.previousIndex, event.currentIndex);
      
      // Re-render canvases after reordering
      setTimeout(() => this.renderCanvases(), 100);
      
      this.messageService.add({
        severity: 'info',
        summary: 'Page Moved',
        detail: `Page moved from position ${event.previousIndex + 1} to ${event.currentIndex + 1}`,
      });
    }
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
    const previewCanvasElements = document.querySelectorAll('.preview-content canvas');

    // Render main canvases
    canvasElements.forEach((canvas, index) => {
      if (pages[index] && canvas instanceof HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(pages[index].canvas, 0, 0);
        }
      }
    });

    // Render preview canvases (smaller versions for drag preview)
    previewCanvasElements.forEach((canvas, index) => {
      if (pages[index] && canvas instanceof HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Scale down the image for preview
          ctx.drawImage(
            pages[index].canvas, 
            0, 0, 
            canvas.width, 
            canvas.height
          );
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
