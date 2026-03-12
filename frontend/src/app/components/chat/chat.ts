import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { MessageService, IMessage } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatMenuModule
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  amigoId: number = 0;
  amigo: IUser | null = null;
  mensajes: IMessage[] = [];
  nuevoMensaje = '';
  cargando = false;
  enviando = false;
  error = '';
  usuarioActual: any = null;

  private intervalId: any;

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private friendshipService: FriendshipService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUserData();
    if (!this.usuarioActual) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      this.amigoId = +params['id'];
      if (this.amigoId) {
        this.cargarDatosAmigo();
        this.cargarMensajes();
        this.iniciarActualizacionAutomatica();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarDatosAmigo(): void {
    // Cargar datos del amigo
    this.friendshipService.listarAmigos().subscribe({
      next: (amigos) => {
        this.amigo = amigos.find(a => a.id === this.amigoId) || null;
        if (!this.amigo) {
          this.error = 'Usuario no encontrado o no es tu amigo';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos del amigo:', err);
      }
    });
  }

  cargarMensajes(): void {
    this.cargando = true;
    this.error = '';
    this.messageService.obtenerConversacion(this.amigoId).subscribe({
      next: (data) => {
        this.mensajes = data;
        this.cargando = false;
        this.marcarConversacionComoLeida();
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Error al cargar mensajes:', err);
        this.error = 'No se pudieron cargar los mensajes';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || this.enviando) {
      return;
    }

    this.enviando = true;
    const mensajeTexto = this.nuevoMensaje.trim();
    this.nuevoMensaje = '';

    this.messageService.enviarMensaje(this.amigoId, mensajeTexto).subscribe({
      next: (data) => {
        this.enviando = false;
        this.cargarMensajes();
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);
        this.error = 'No se pudo enviar el mensaje';
        this.nuevoMensaje = mensajeTexto; // Restaurar el mensaje
        this.enviando = false;
        this.cdr.detectChanges();
      }
    });
  }

  marcarConversacionComoLeida(): void {
    this.messageService.marcarConversacionLeida(this.amigoId).subscribe({
      next: () => {
        // Conversación marcada como leída
      },
      error: (err) => {
        console.error('Error al marcar conversación como leída:', err);
      }
    });
  }

  iniciarActualizacionAutomatica(): void {
    // Actualizar mensajes cada 5 segundos
    this.intervalId = setInterval(() => {
      this.actualizarMensajesSilenciosamente();
    }, 5000);
  }

  actualizarMensajesSilenciosamente(): void {
    this.messageService.obtenerConversacion(this.amigoId).subscribe({
      next: (data) => {
        const mensajesAnteriores = this.mensajes.length;
        this.mensajes = data;
        if (data.length > mensajesAnteriores) {
          this.marcarConversacionComoLeida();
          setTimeout(() => this.scrollToBottom(), 100);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al actualizar mensajes:', err);
      }
    });
  }

  scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  esMensajeMio(mensaje: IMessage): boolean {
    return mensaje.sender_id === this.usuarioActual?.id;
  }

  volverMensajes(): void {
    this.router.navigate(['/mensajes']);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
}
