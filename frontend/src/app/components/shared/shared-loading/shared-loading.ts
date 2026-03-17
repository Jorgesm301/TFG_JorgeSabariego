import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-shared-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-state">
      <mat-spinner diameter="48"></mat-spinner>
      <p>{{ mensaje }}</p>
    </div>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 64px 24px;
      color: #1976D2;
    }

    .loading-state p {
      font-size: 16px;
      color: #555;
    }
  `]
})
export class SharedLoadingComponent {
  @Input() mensaje: string = 'Cargando...';
}
