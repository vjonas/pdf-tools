import {
  Component,
  input,
  output,
  AfterViewChecked,
  OnChanges,
  ViewChildren,
  QueryList,
  ElementRef,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfService, PdfPageInfo } from '../../services/pdf.service';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

// Angular CDK Drag Drop imports
import { CdkDrag, CdkDropList, CdkDragDrop, CdkDragStart, CdkDragEnd, CdkDragEnter, CdkDragExit } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-pdf-thumbnail-view',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, CdkDrag, CdkDropList],
  template: `
    <div class="thumbnails-container">
      <div 
        class="thumbnails-grid"
        cdkDropList
        [cdkDropListData]="pages()"
        (cdkDropListDropped)="onPageDrop($event)"
        (cdkDropListEntered)="onDragEntered($event)"
        (cdkDropListExited)="onDragExited($event)"
        cdkDropListOrientation="mixed"
        [class.dragging-active]="isDragging()"
      >
        @for (page of pages(); track page.pageNumber) {
        <!-- Drop indicator line (shown before each card when dragging) -->
        @if (isDragging() && shouldShowDropIndicator($index)) {
        <div class="drop-indicator" 
             [class.active]="dropIndicatorIndex() === $index"
             (dragover)="onDropIndicatorDragOver($event, $index)"
             (dragleave)="onDropIndicatorDragLeave($event)">
          <div class="drop-line">
            <span class="drop-text">Drop here</span>
          </div>
        </div>
        }

        <div
          class="thumbnail-card"
          [class.selected]="selectedPageIndex() === $index"
          [class.dragging]="draggedItemIndex() === $index"
          [class.drag-target]="isDragTarget($index)"
          cdkDrag
          [cdkDragData]="{ page: page, index: $index }"
          (cdkDragStarted)="onDragStarted($event, $index)"
          (cdkDragEnded)="onDragEnded($event)"
          (click)="onPageSelect($index)"
        >
          <!-- Enhanced drag preview with page information -->
          <div class="thumbnail-drag-preview" *cdkDragPreview>
            <div class="drag-preview-card">
              <div class="preview-header">
                <div class="preview-badge">
                  <i class="pi pi-arrows-alt"></i>
                  <span>Moving Page {{ $index + 1 }}</span>
                </div>
                <div class="preview-info">
                  <span class="page-count">{{ pages().length }} pages total</span>
                </div>
              </div>
              <div class="preview-thumbnail">
                <canvas
                  [attr.width]="page.width * 0.25"
                  [attr.height]="page.height * 0.25"
                  #previewCanvas
                ></canvas>
              </div>
            </div>
          </div>

          <!-- Enhanced placeholder with better visual feedback -->
          <div class="thumbnail-placeholder" *cdkDragPlaceholder>
            <div class="placeholder-content">
              <div class="placeholder-header">
                <span class="placeholder-badge">Page {{ $index + 1 }}</span>
              </div>
              <div class="placeholder-body">
                <i class="pi pi-image placeholder-icon"></i>
                <div class="placeholder-animation">
                  <div class="pulse-ring"></div>
                  <div class="pulse-ring delay-1"></div>
                  <div class="pulse-ring delay-2"></div>
                </div>
                <span class="placeholder-text">Moving to new position...</span>
              </div>
            </div>
          </div>

          <!-- Enhanced thumbnail card with drag handle -->
          <p-card [class.card-hover-disabled]="isDragging()">
            <ng-template pTemplate="header">
              <div class="page-header">
                <div class="page-info">
                  <div class="drag-handle" 
                       [class.visible]="!isDragging()"
                       title="Drag to reorder">
                    <i class="pi pi-bars"></i>
                  </div>
                  <span class="page-number">Page {{ $index + 1 }}</span>
                </div>
                <div class="page-actions" [class.hidden]="isDragging()">
                  <p-button
                    icon="pi pi-copy"
                    size="small"
                    (click)="onPageDuplicate($event, $index)"
                    class="p-button-rounded p-button-text p-button-sm"
                    title="Duplicate page"
                  >
                  </p-button>
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    (click)="onPageDelete($event, $index)"
                    class="p-button-rounded p-button-text p-button-danger p-button-sm"
                    title="Delete page"
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
              >
              </canvas>
              @if (isDragging() && draggedItemIndex() !== $index) {
              <div class="reorder-overlay">
                <div class="reorder-message">
                  <i class="pi pi-sort-alt"></i>
                  <span>Reordering pages...</span>
                </div>
              </div>
              }
            </div>
          </p-card>
        </div>
        }

        <!-- Final drop indicator (after last card) -->
        @if (isDragging()) {
        <div class="drop-indicator final" 
             [class.active]="dropIndicatorIndex() === pages().length"
             (dragover)="onDropIndicatorDragOver($event, pages().length)"
             (dragleave)="onDropIndicatorDragLeave($event)">
          <div class="drop-line">
            <span class="drop-text">Drop at end</span>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./pdf-thumbnail-view.component.scss'],
})
export class PdfThumbnailViewComponent
  implements AfterViewChecked, OnChanges, OnDestroy
{
  @ViewChildren('canvas') canvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('previewCanvas') previewCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  // Inputs
  pages = input.required<PdfPageInfo[]>();
  selectedPageIndex = input<number | null>(null);

  // Outputs
  pageSelected = output<number>();
  pageDuplicated = output<number>();
  pageDeleted = output<number>();
  pageReordered = output<{ fromIndex: number; toIndex: number }>();

  // Drag state signals
  isDragging = signal<boolean>(false);
  draggedItemIndex = signal<number | null>(null);
  dropIndicatorIndex = signal<number | null>(null);

  private pdfService = inject(PdfService);
  private messageService = inject(MessageService);
  private canvasesRendered = new Set<number>();
  private previewCanvasesRendered = new Set<number>();

  ngAfterViewChecked(): void {
    this.renderCanvases();
    this.renderPreviewCanvases();
  }

  ngOnChanges(): void {
    // Reset rendered canvases when pages change
    this.canvasesRendered.clear();
    this.previewCanvasesRendered.clear();
  }

  ngOnDestroy(): void {
    this.canvasesRendered.clear();
    this.previewCanvasesRendered.clear();
  }

  onPageSelect(index: number): void {
    if (!this.isDragging()) {
      this.pageSelected.emit(index);
    }
  }

  onPageDuplicate(event: Event, index: number): void {
    event.stopPropagation(); // Prevent page selection
    this.pageDuplicated.emit(index);
  }

  onPageDelete(event: Event, index: number): void {
    event.stopPropagation(); // Prevent page selection
    this.pageDeleted.emit(index);
  }

  // Enhanced drag event handlers
  onDragStarted(event: CdkDragStart, index: number): void {
    this.isDragging.set(true);
    this.draggedItemIndex.set(index);
    
    // Add dragging class to body for global styles
    document.body.classList.add('pdf-dragging');
    
    this.messageService.add({
      severity: 'info',
      summary: 'Drag Started',
      detail: `Dragging page ${index + 1}. Drop it in a new position to reorder.`,
      life: 2000
    });
  }

  onDragEnded(event: CdkDragEnd): void {
    this.isDragging.set(false);
    this.draggedItemIndex.set(null);
    this.dropIndicatorIndex.set(null);
    
    // Remove dragging class from body
    document.body.classList.remove('pdf-dragging');
  }

  onDragEntered(event: CdkDragEnter): void {
    // Visual feedback when entering the drop zone
  }

  onDragExited(event: CdkDragExit): void {
    this.dropIndicatorIndex.set(null);
  }

  // Enhanced drag drop handler
  onPageDrop(event: CdkDragDrop<PdfPageInfo[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      // Emit the reorder event
      this.pageReordered.emit({
        fromIndex: event.previousIndex,
        toIndex: event.currentIndex
      });
      
      // Enhanced success message with more detail
      const fromPage = event.previousIndex + 1;
      const toPage = event.currentIndex + 1;
      const direction = event.currentIndex > event.previousIndex ? 'forward' : 'backward';
      
      this.messageService.add({
        severity: 'success',
        summary: 'Page Reordered',
        detail: `Page ${fromPage} moved ${direction} to position ${toPage}`,
        life: 3000
      });
    }
  }

  // Drop indicator handlers
  onDropIndicatorDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dropIndicatorIndex.set(index);
  }

  onDropIndicatorDragLeave(event: DragEvent): void {
    // Only hide if actually leaving the indicator area
    const target = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!target || !currentTarget?.contains(target)) {
      this.dropIndicatorIndex.set(null);
    }
  }

  // Helper methods for template logic
  shouldShowDropIndicator(index: number): boolean {
    return this.draggedItemIndex() !== index && this.draggedItemIndex() !== index - 1;
  }

  isDragTarget(index: number): boolean {
    const dropIndex = this.dropIndicatorIndex();
    return dropIndex !== null && (dropIndex === index || dropIndex === index + 1);
  }

  private renderCanvases(): void {
    if (!this.canvases) return;

    this.canvases.forEach((canvasRef, index) => {
      const canvas = canvasRef.nativeElement;
      const page = this.pages()[index];

      if (page && !this.canvasesRendered.has(index)) {
        const ctx = canvas.getContext('2d');
        if (ctx && page.canvas) {
          // Scale down for thumbnail
          const scale = 0.3;
          canvas.width = page.width * scale;
          canvas.height = page.height * scale;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(page.canvas, 0, 0, canvas.width, canvas.height);
          this.canvasesRendered.add(index);
        }
      }
    });
  }

  private renderPreviewCanvases(): void {
    if (!this.previewCanvases) return;

    this.previewCanvases.forEach((canvasRef, index) => {
      const canvas = canvasRef.nativeElement;
      const page = this.pages()[index];

      if (page && !this.previewCanvasesRendered.has(index)) {
        const ctx = canvas.getContext('2d');
        if (ctx && page.canvas) {
          // Smaller scale for drag preview
          const scale = 0.25;
          canvas.width = page.width * scale;
          canvas.height = page.height * scale;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(page.canvas, 0, 0, canvas.width, canvas.height);
          this.previewCanvasesRendered.add(index);
        }
      }
    });
  }
}
