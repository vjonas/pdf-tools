import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  AfterViewChecked,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfService } from './services/pdf.service';
import { PdfThumbnailViewComponent } from './components/pdf-thumbnail-view/pdf-thumbnail-view.component';
import { PdfDetailViewComponent } from './components/pdf-detail-view/pdf-detail-view.component';

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
import { InputSwitchModule } from 'primeng/inputswitch';
import { HttpClientModule } from '@angular/common/http';

// Angular CDK Drag Drop Module
import { DragDropModule } from '@angular/cdk/drag-drop';

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
    InputSwitchModule,
    HttpClientModule,
    DragDropModule,
    PdfThumbnailViewComponent,
    PdfDetailViewComponent,
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
  selectedPageIndex = signal<number | null>(null);
  showDetailView = signal<boolean>(true);

  splitRanges: { start: number; end: number; filename: string }[] = [
    { start: 1, end: 1, filename: 'part1.pdf' },
  ];

  splitSaveLocation = '';

  private readonly SPLIT_SAVE_LOCATION_KEY =
    'pdf-organiser-split-save-location';

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Load saved split location
    this.loadSplitSaveLocation();
  }

  ngAfterViewInit(): void {
    // Signal to Electron that Angular is ready
    if (this.isElectron && window.electronAPI) {
      // Wait a bit for Angular to fully initialize
      setTimeout(() => {
        window.electronAPI.signalAngularReady();
      }, 500);
    }
  }

  ngAfterViewChecked(): void {
    // No longer needed as canvas rendering is handled by child components
  }

  get selectedPage() {
    const index = this.selectedPageIndex();
    return index !== null ? this.pdfService.pages()[index] : null;
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
      // Reset selection when loading a new PDF
      this.selectedPageIndex.set(null);
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
        // Reset selection when loading a new PDF
        this.selectedPageIndex.set(null);
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

  onPageSelected(index: number): void {
    this.selectedPageIndex.set(index);
    this.showDetailView.set(true);
  }

  onPageReordered(event: { fromIndex: number; toIndex: number }): void {
    this.pdfService.reorderPages(event.fromIndex, event.toIndex);
    // Update selected page index if it was moved
    const currentSelected = this.selectedPageIndex();
    if (currentSelected !== null) {
      if (currentSelected === event.fromIndex) {
        this.selectedPageIndex.set(event.toIndex);
      } else if (
        currentSelected > event.fromIndex &&
        currentSelected <= event.toIndex
      ) {
        this.selectedPageIndex.set(currentSelected - 1);
      } else if (
        currentSelected < event.fromIndex &&
        currentSelected >= event.toIndex
      ) {
        this.selectedPageIndex.set(currentSelected + 1);
      }
    }
  }

  onPageDuplicated(index: number): void {
    this.pdfService.duplicatePage(index);
    // Update selected index if needed
    const currentSelected = this.selectedPageIndex();
    if (currentSelected !== null && currentSelected >= index) {
      this.selectedPageIndex.set(currentSelected + 1);
    }
  }

  onPageDeleted(index: number): void {
    this.pdfService.removePage(index);
    // Update selected index if needed
    const currentSelected = this.selectedPageIndex();
    if (currentSelected !== null) {
      if (currentSelected === index) {
        // If the deleted page was selected, select the next page or the last one
        const newPagesLength = this.pdfService.pages().length;
        if (newPagesLength === 0) {
          this.selectedPageIndex.set(null);
        } else if (index >= newPagesLength) {
          this.selectedPageIndex.set(newPagesLength - 1);
        } else {
          this.selectedPageIndex.set(index);
        }
      } else if (currentSelected > index) {
        this.selectedPageIndex.set(currentSelected - 1);
      }
    }
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
