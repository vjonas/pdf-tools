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
import { CdkDrag, CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';

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
        cdkDropListOrientation="mixed"
      >
        @for (page of pages(); track page.pageNumber) {
        <div
          class="thumbnail-card"
          [class.selected]="selectedPageIndex() === $index"
          cdkDrag
          [cdkDragData]="{ page: page, index: $index }"
          (click)="onPageSelect($index)"
        >
          <!-- Custom drag preview -->
          <div class="thumbnail-drag-preview" *cdkDragPreview>
            <p-card class="drag-preview-card">
              <ng-template pTemplate="header">
                <div class="page-header">
                  <span class="page-number">Page {{ $index + 1 }}</span>
                </div>
              </ng-template>
              <div class="page-content preview-content">
                <canvas
                  [attr.width]="page.width * 0.3"
                  [attr.height]="page.height * 0.3"
                  #previewCanvas
                ></canvas>
              </div>
            </p-card>
          </div>

          <!-- Placeholder shown in the original position while dragging -->
          <div class="thumbnail-placeholder" *cdkDragPlaceholder>
            <div class="placeholder-content">
              <i class="pi pi-arrows-alt placeholder-icon"></i>
              <span class="placeholder-text">Drop page here</span>
            </div>
          </div>

          <!-- Actual thumbnail card -->
          <p-card>
            <ng-template pTemplate="header">
              <div class="page-header">
                <span class="page-number">Page {{ $index + 1 }}</span>
                <div class="page-actions">
                  <p-button
                    icon="pi pi-copy"
                    size="small"
                    (click)="onPageDuplicate($event, $index)"
                    class="p-button-rounded p-button-text p-button-sm"
                  >
                  </p-button>
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    (click)="onPageDelete($event, $index)"
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
              >
              </canvas>
            </div>
          </p-card>
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
    this.pageSelected.emit(index);
  }

  onPageDuplicate(event: Event, index: number): void {
    event.stopPropagation(); // Prevent page selection
    this.pageDuplicated.emit(index);
  }

  onPageDelete(event: Event, index: number): void {
    event.stopPropagation(); // Prevent page selection
    this.pageDeleted.emit(index);
  }

  // Updated drag drop handler using CDK
  onPageDrop(event: CdkDragDrop<PdfPageInfo[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      // Emit the reorder event
      this.pageReordered.emit({
        fromIndex: event.previousIndex,
        toIndex: event.currentIndex
      });
      
      // Show success message
      this.messageService.add({
        severity: 'info',
        summary: 'Page Moved',
        detail: `Page moved from position ${event.previousIndex + 1} to ${event.currentIndex + 1}`,
      });
    }
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
          // Even smaller scale for drag preview
          const scale = 0.3;
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
