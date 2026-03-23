import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IConversation } from '../../../services/message.service';
import { IUser } from '../../../services/friendship.service';

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
  @Input() abierto: boolean | null = false;
  @Input() modoNuevoMensaje: boolean | null = false;

  @Input() cargandoConversaciones: boolean | null = false;
  @Input() conversaciones: IConversation[] | null = [];

  @Input() cargandoAmigos: boolean | null = false;
  @Input() amigos: IUser[] | null = [];

  // Getters para manejar null values de forma segura
  get abiertoClear(): boolean {
    return this.abierto ?? false;
  }

  get modoNuevoMensajeClear(): boolean {
    return this.modoNuevoMensaje ?? false;
  }

  get cargandoConversacionesClear(): boolean {
    return this.cargandoConversaciones ?? false;
  }

  get conversacionesClear(): IConversation[] {
    return this.conversaciones ?? [];
  }

  get cargandoAmigosClear(): boolean {
    return this.cargandoAmigos ?? false;
  }

  get amigosClear(): IUser[] {
    return this.amigos ?? [];
  }

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
