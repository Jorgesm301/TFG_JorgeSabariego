import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface IHeaderSport {
  nombre: string;
  icon: string;
  ruta: string;
}

@Component({
  selector: 'app-shared-page-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './shared-page-header.html',
  styleUrl: './shared-page-header.css'
})
export class SharedPageHeaderComponent {
  @Input() estaLogueado = false;
  @Input() nombreUsuario = '';
  @Input() deportesMenu: IHeaderSport[] = [];
  @Input() totalNoLeidos = 0;
  @Input() showMessagesButton = true;
  @Input() showSubheader = true;
  @Input() showReservarMenu = true;
  @Input() showMisReservasButton = true;
  @Input() activeNav: 'reservar' | 'mis-reservas' | '' = '';
  @Input() profileRoute = '/perfil';

  @Output() messagesClick = new EventEmitter<void>();
  @Output() deporteSelect = new EventEmitter<string>();

  onMessagesClick(): void {
    this.messagesClick.emit();
  }

  onSelectDeporte(ruta: string): void {
    this.deporteSelect.emit(ruta);
  }
}

