import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-shared-error',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="error-state">
      <mat-card class="error-card">
        <mat-card-content>
          <mat-icon class="error-icon" color="warn">error_outline</mat-icon>
          <h3>{{ mensaje }}</h3>
          <button mat-raised-button color="primary" (click)="onReintentar()">
            <mat-icon>refresh</mat-icon>
            Reintentar
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      justify-content: center;
      padding: 28px 0;
    }

    .error-card {
      max-width: 480px;
      width: 100%;
      text-align: center;
      border-radius: 16px !important;
      padding: 16px;
      background: linear-gradient(160deg, #ffffff 0%, #fff5f5 100%) !important;
      border: 1px solid rgba(220, 38, 38, 0.14) !important;
    }

    mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px !important;
    }

    .error-icon {
      font-size: 56px !important;
      width: 56px !important;
      height: 56px !important;
    }

    h3 {
      margin: 0;
      color: #0f172a;
    }

    button {
      margin-top: 8px;
    }
  `]
})
export class SharedErrorComponent {
  @Input() mensaje: string = 'Ocurrió un error';
  @Output() reintentar = new EventEmitter<void>();

  onReintentar(): void {
    this.reintentar.emit();
  }
}
