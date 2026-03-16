import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface IDrawerConversation {
  amigo: {
    id: number;
    name: string;
    last_name: string;
  };
  ultimo_mensaje: {
    message: string;
    created_at: string;
  };
  no_leidos: number;
}

export interface IDrawerFriend {
  id: number;
  name: string;
  last_name: string;
  email: string;
}

@Component({
  selector: 'app-shared-messages-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './shared-messages-drawer.html',
  styleUrl: './shared-messages-drawer.css'
})
export class SharedMessagesDrawerComponent {
  @Input() abierto = false;
  @Input() modoNuevoMensaje = false;

  @Input() cargandoConversaciones = false;
  @Input() conversaciones: IDrawerConversation[] = [];

  @Input() cargandoAmigos = false;
  @Input() amigos: IDrawerFriend[] = [];

  @Output() cerrar = new EventEmitter<void>();
  @Output() abrirNuevoMensaje = new EventEmitter<void>();
  @Output() volverAConversaciones = new EventEmitter<void>();
  @Output() abrirChat = new EventEmitter<number>();
  @Output() irAMensajes = new EventEmitter<void>();

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onAbrirNuevoMensaje(): void {
    this.abrirNuevoMensaje.emit();
  }

  onVolverAConversaciones(): void {
    this.volverAConversaciones.emit();
  }

  onAbrirChat(amigoId: number): void {
    this.abrirChat.emit(amigoId);
  }

  onIrAMensajes(): void {
    this.irAMensajes.emit();
  }
}
