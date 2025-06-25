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
import { DragDropModule } from 'primeng/dragdrop';

@Component({
  selector: 'app-pdf-thumbnail-view',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, DragDropModule],
  template: `
    <div class="thumbnails-container">
      <div class="thumbnails-grid">
        @for (page of pages(); track page.pageNumber) {
        <div
          class="thumbnail-card"
          [class.selected]="selectedPageIndex() === $index"
          pDraggable="pages"
          pDroppable="pages"
          (onDrop)="onPageDrop($event, $index)"
          (onDragStart)="onDragStart($index)"
          (onDragEnd)="onDragEnd()"
          (click)="onPageSelect($index)"
        >
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

  // Inputs
  pages = input.required<PdfPageInfo[]>();
  selectedPageIndex = input<number | null>(null);

  // Outputs
  pageSelected = output<number>();
  pageDuplicated = output<number>();
  pageDeleted = output<number>();
  pageReordered = output<{ fromIndex: number; toIndex: number }>();

  private pdfService = inject(PdfService);
  private draggedPageIndex = signal<number | null>(null);
  private canvasesRendered = new Set<number>();

  ngAfterViewChecked(): void {
    this.renderCanvases();
  }

  ngOnChanges(): void {
    // Reset rendered canvases when pages change
    this.canvasesRendered.clear();
  }

  ngOnDestroy(): void {
    this.canvasesRendered.clear();
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

  onDragStart(index: number): void {
    this.draggedPageIndex.set(index);
  }

  onDragEnd(): void {
    this.draggedPageIndex.set(null);
  }

  onPageDrop(event: any, targetIndex: number): void {
    const sourceIndex = this.draggedPageIndex();
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      this.pageReordered.emit({ fromIndex: sourceIndex, toIndex: targetIndex });
    }
    this.draggedPageIndex.set(null);
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
}
