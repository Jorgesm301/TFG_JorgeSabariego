import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-shared-empty',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-card class="empty-card">
        <mat-card-content>
          <mat-icon class="empty-icon">{{ icono }}</mat-icon>
          <h2>{{ titulo }}</h2>
          <p>{{ descripcion }}</p>
          <button
            mat-raised-button
            color="primary"
            (click)="onAccion()"
            *ngIf="mostrarBoton">
            <mat-icon>{{ iconoBoton }}</mat-icon>
            {{ textoBoton }}
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      justify-content: center;
      padding: 28px 0;
    }

    .empty-card {
      max-width: 480px;
      width: 100%;
      text-align: center;
      border-radius: 16px !important;
      padding: 16px;
      background: linear-gradient(160deg, #ffffff 0%, #f0f7ff 100%) !important;
      border: 1px solid rgba(25, 118, 210, 0.14) !important;
    }

    mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px !important;
    }

    .empty-icon {
      font-size: 56px !important;
      width: 56px !important;
      height: 56px !important;
      color: #94a3b8;
    }

    h2 {
      margin: 0;
      color: #0f172a;
    }

    p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    button {
      margin-top: 8px;
    }
  `]
})
export class SharedEmptyComponent {
  @Input() icono: string = 'inbox';
  @Input() titulo: string = 'Sin resultados';
  @Input() descripcion: string = 'No hay elementos para mostrar';
  @Input() mostrarBoton: boolean = false;
  @Input() textoBoton: string = 'Crear';
  @Input() iconoBoton: string = 'add_circle';
  @Output() accion = new EventEmitter<void>();

  onAccion(): void {
    this.accion.emit();
  }
}
