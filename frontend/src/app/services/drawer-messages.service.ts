import { Injectable, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService, IConversation } from './message.service';
import { FriendshipService, IUser } from './friendship.service';

@Injectable({ providedIn: 'root' })
export class DrawerMessagesService {
  // Estado del drawer
  drawerAbierto$ = new BehaviorSubject<boolean>(false);
  modoNuevoMensaje$ = new BehaviorSubject<boolean>(false);

  // Conversaciones
  conversaciones$ = new BehaviorSubject<IConversation[]>([]);
  cargandoConversaciones$ = new BehaviorSubject<boolean>(false);

  // Amigos para nuevo mensaje
  amigos$ = new BehaviorSubject<IUser[]>([]);
  cargandoAmigos$ = new BehaviorSubject<boolean>(false);

  private intervaloMensajes: any;

  constructor(
    private messageService: MessageService,
    private friendshipService: FriendshipService,
    private router: Router
  ) {}

  // ===== ESTADO =====
  toggleDrawer(): void {
    const estado = !this.drawerAbierto$.value;
    this.drawerAbierto$.next(estado);
    if (estado) {
      this.cargarConversaciones();
    }
  }

  cerrarDrawer(): void {
    this.drawerAbierto$.next(false);
    this.modoNuevoMensaje$.next(false);
  }

  abrirNuevoMensaje(): void {
    this.modoNuevoMensaje$.next(true);
    this.cargarAmigos();
  }

  volverAConversaciones(): void {
    this.modoNuevoMensaje$.next(false);
  }

  // ===== CONVERSACIONES =====
  cargarConversaciones(): void {
    this.cargandoConversaciones$.next(true);
    this.messageService.listarConversaciones().subscribe({
      next: (data) => {
        this.conversaciones$.next(data);
        this.cargandoConversaciones$.next(false);
      },
      error: (err) => {
        console.error('Error al cargar conversaciones:', err);
        this.cargandoConversaciones$.next(false);
      }
    });
  }

  iniciarActualizacionMensajes(): void {
    // Actualizar cada 30 segundos
    this.intervaloMensajes = setInterval(() => {
      this.cargarConversaciones();
    }, 30000);
  }

  detenerActualizacionMensajes(): void {
    if (this.intervaloMensajes) {
      clearInterval(this.intervaloMensajes);
      this.intervaloMensajes = null;
    }
  }

  getTotalNoLeidos(): Observable<number> {
    return new Observable(observer => {
      this.conversaciones$.subscribe(conversaciones => {
        const total = conversaciones.reduce((sum, conv) => sum + conv.no_leidos, 0);
        observer.next(total);
      });
    });
  }

  // ===== AMIGOS =====
  cargarAmigos(): void {
    this.cargandoAmigos$.next(true);
    this.friendshipService.listarAmigos().subscribe({
      next: (data) => {
        this.amigos$.next(data);
        this.cargandoAmigos$.next(false);
      },
      error: (err) => {
        console.error('Error al cargar amigos:', err);
        this.cargandoAmigos$.next(false);
      }
    });
  }

  // ===== NAVEGACIÓN =====
  abrirChat(amigoId: number): void {
    this.cerrarDrawer();
    this.router.navigate(['/chat', amigoId]);
  }

  irAMensajes(): void {
    this.cerrarDrawer();
    this.router.navigate(['/mensajes']);
  }

  // ===== LIMPIEZA =====
  limpiar(): void {
    this.detenerActualizacionMensajes();
    this.drawerAbierto$.next(false);
    this.modoNuevoMensaje$.next(false);
    this.conversaciones$.next([]);
    this.amigos$.next([]);
  }
}
