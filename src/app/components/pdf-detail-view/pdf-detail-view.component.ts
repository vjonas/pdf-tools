import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfPageInfo } from '../../services/pdf.service';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-pdf-detail-view',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ToolbarModule],
  template: `
    <div class="detail-view-container">
      @if (selectedPage()) {
      <p-card class="detail-card">
        <ng-template pTemplate="header">
          <p-toolbar class="detail-toolbar">
            <div class="p-toolbar-group-start">
              <span class="detail-page-title">
                Page {{ (selectedPageIndex() ?? 0) + 1 }} - Detail View
              </span>
            </div>
            <div class="p-toolbar-group-end">
              <p-button
                icon="pi pi-search-plus"
                (click)="zoomIn()"
                class="p-button-rounded p-button-text p-button-sm"
                [disabled]="currentZoom >= maxZoom"
              >
              </p-button>
              <span class="zoom-level"
                >{{ Math.round(currentZoom * 100) }}%</span
              >
              <p-button
                icon="pi pi-search-minus"
                (click)="zoomOut()"
                class="p-button-rounded p-button-text p-button-sm"
                [disabled]="currentZoom <= minZoom"
              >
              </p-button>
              <p-button
                icon="pi pi-refresh"
                (click)="resetZoom()"
                class="p-button-rounded p-button-text p-button-sm"
              >
              </p-button>
            </div>
          </p-toolbar>
        </ng-template>

        <div class="detail-content" #scrollContainer>
          <div
            class="canvas-container"
            [style.transform]="'scale(' + currentZoom + ')'"
          >
            <canvas
              #detailCanvas
              [attr.width]="selectedPage()?.width"
              [attr.height]="selectedPage()?.height"
            >
            </canvas>
          </div>
        </div>
      </p-card>
      } @else {
      <div class="no-selection">
        <div class="no-selection-content">
          <i
            class="pi pi-file-pdf"
            style="font-size: 3rem; color: var(--text-color-secondary);"
          ></i>
          <h4>No page selected</h4>
          <p>Click on a thumbnail to view the page in detail</p>
        </div>
      </div>
      }
    </div>
  `,
  styleUrls: ['./pdf-detail-view.component.scss'],
})
export class PdfDetailViewComponent
  implements OnChanges, AfterViewInit, AfterViewChecked
{
  @ViewChild('detailCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  // Inputs
  selectedPage = input<PdfPageInfo | null>(null);
  selectedPageIndex = input<number | null>(null);

  // Zoom controls
  currentZoom = 1.0;
  minZoom = 0.25;
  maxZoom = 3.0;
  zoomStep = 0.25;

  // Expose Math for template
  Math = Math;

  ngAfterViewInit(): void {
    this.renderSelectedPage();
  }

  ngAfterViewChecked(): void {
    this.renderSelectedPage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPage'] && this.canvasRef) {
      this.renderSelectedPage();
      // Don't reset zoom when page changes - preserve user's zoom level
    }
  }

  zoomIn(): void {
    if (this.currentZoom < this.maxZoom) {
      this.currentZoom = Math.min(
        this.currentZoom + this.zoomStep,
        this.maxZoom
      );
    }
  }

  zoomOut(): void {
    if (this.currentZoom > this.minZoom) {
      this.currentZoom = Math.max(
        this.currentZoom - this.zoomStep,
        this.minZoom
      );
    }
  }

  resetZoom(): void {
    this.currentZoom = 1.0;
    // Reset scroll position when zoom is reset
    if (this.scrollContainer) {
      const container = this.scrollContainer.nativeElement;
      container.scrollTop = 0;
      container.scrollLeft = 0;
    }
  }

  private renderSelectedPage(): void {
    const page = this.selectedPage();
    if (!page || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (ctx && page.canvas) {
      // Set canvas size to match original page
      canvas.width = page.width;
      canvas.height = page.height;

      // Clear and draw the page
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(page.canvas, 0, 0);
    }
  }
}
