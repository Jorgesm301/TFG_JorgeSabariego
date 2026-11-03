import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser, IFriendship } from '../../services/friendship.service';
import { BlockedUserService, IBlockedUser } from '../../services/blocked-user.service';
import { MatMenuModule } from '@angular/material/menu';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';
import { SharedMessagesDrawerComponent } from '../shared/shared-messages-drawer/shared-messages-drawer';

@Component({
  selector: 'app-amigos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedPageHeaderComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatListModule,
    MatDividerModule,
    SharedMessagesDrawerComponent
  ],
  templateUrl: './amigos.html',
  styleUrl: './amigos.css'
})
export class Amigos implements OnInit, OnDestroy {
  amigos: IUser[] = [];
  solicitudesPendientes: IFriendship[] = [];
  usuariosBuscados: IUser[] = [];
  usuariosBloqueados: IBlockedUser[] = [];
  busqueda: string = '';
  cargando = false;
  cargandoSolicitudes = false;
  cargandoBusqueda = false;
  cargandoBloqueados = false;
  error = '';
  drawerAbierto = false;
  conversaciones: IConversation[] = [];
  cargandoConversaciones = false;
  modoNuevoMensaje = false;
  amigosDrawer: IUser[] = [];
  cargandoAmigosDrawer = false;
  private intervaloMensajes: any;
  vistaActual: 'amigos' | 'solicitudes' | 'buscar' | 'bloqueados' = 'amigos';
  mensaje: string = '';
  mensajeTipo: 'success' | 'error' | 'info' = 'info';

  deportesMenu = [
    { nombre: 'Futbol', icon: 'sports_soccer', ruta: '/reservar/futbol' },
    { nombre: 'Futbol Sala', icon: 'sports_soccer', ruta: '/reservar/futbol-sala' },
    { nombre: 'Baloncesto', icon: 'sports_basketball', ruta: '/reservar/baloncesto' },
    { nombre: 'Tenis', icon: 'sports_tennis', ruta: '/reservar/tenis' },
    { nombre: 'Padel', icon: 'sports_tennis', ruta: '/reservar/padel' },
    { nombre: 'Voleibol', icon: 'sports_volleyball', ruta: '/reservar/voleibol' },
    { nombre: 'Natacion', icon: 'pool', ruta: '/reservar/natacion' },
    { nombre: 'Atletismo', icon: 'directions_run', ruta: '/reservar/atletismo' }
  ];

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private friendshipService: FriendshipService,
    private blockedUserService: BlockedUserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.getUserData();
    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarAmigos();
    this.cargarSolicitudes();
    this.cargarConversaciones();
    this.iniciarActualizacionMensajes();
  }

  ngOnDestroy(): void {
    if (this.intervaloMensajes) {
      clearInterval(this.intervaloMensajes);
    }
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
  }

  cargarConversaciones(): void {
    this.cargandoConversaciones = true;
    this.messageService.listarConversaciones().subscribe({
      next: (data) => {
        this.conversaciones = data;
        this.cargandoConversaciones = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar conversaciones:', err);
        this.cargandoConversaciones = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarActualizacionMensajes(): void {
    this.intervaloMensajes = setInterval(() => {
      this.cargarConversaciones();
    }, 30000);
  }

  getTotalNoLeidos(): number {
    return this.conversaciones.reduce((sum, conv) => sum + conv.no_leidos, 0);
  }

  toggleDrawer(): void {
    this.drawerAbierto = !this.drawerAbierto;
    if (this.drawerAbierto) {
      this.cargarConversaciones();
    }
  }

  cerrarDrawer(): void {
    this.drawerAbierto = false;
    this.modoNuevoMensaje = false;
  }

  abrirNuevoMensaje(): void {
    this.modoNuevoMensaje = true;
    this.cargarAmigosDrawer();
  }

  volverAConversaciones(): void {
    this.modoNuevoMensaje = false;
  }

  cargarAmigosDrawer(): void {
    this.cargandoAmigosDrawer = true;
    this.friendshipService.listarAmigos().subscribe({
      next: (data) => {
        this.amigosDrawer = data;
        this.cargandoAmigosDrawer = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar amigos:', err);
        this.cargandoAmigosDrawer = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirChatDrawer(amigoId: number): void {
    this.cerrarDrawer();
    this.router.navigate(['/chat', amigoId]);
  }

  irAMensajes(): void {
    this.cerrarDrawer();
    this.router.navigate(['/mensajes']);
  }

  cargarAmigos(): void {
    this.cargando = true;
    this.error = '';
    this.friendshipService.listarAmigos().subscribe({
      next: (data) => {
        this.amigos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar amigos:', err);
        this.error = 'No se pudieron cargar los amigos';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarSolicitudes(): void {
    this.cargandoSolicitudes = true;
    this.friendshipService.listarSolicitudesPendientes().subscribe({
      next: (data) => {
        this.solicitudesPendientes = data;
        this.cargandoSolicitudes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar solicitudes:', err);
        this.cargandoSolicitudes = false;
        this.cdr.detectChanges();
      }
    });
  }

  aceptarSolicitud(solicitud: IFriendship): void {
    this.friendshipService.aceptarSolicitud(solicitud.id).subscribe({
      next: () => {
        this.mostrarMensaje('¡Solicitud aceptada!', 'success');
        this.cargarAmigos();
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error('Error al aceptar solicitud:', err);
        this.mostrarMensaje('No se pudo aceptar la solicitud', 'error');
      }
    });
  }

  rechazarSolicitud(solicitud: IFriendship): void {
    this.friendshipService.rechazarSolicitud(solicitud.id).subscribe({
      next: () => {
        this.mostrarMensaje('Solicitud rechazada', 'info');
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error('Error al rechazar solicitud:', err);
        this.mostrarMensaje('No se pudo rechazar la solicitud', 'error');
      }
    });
  }

  eliminarAmigo(amigo: IUser): void {
    this.friendshipService.eliminarAmigoPorUserId(amigo.id).subscribe({
      next: () => {
        this.mostrarMensaje(`${amigo.name} eliminado de tus amigos`, 'info');
        this.cargarAmigos();
      },
      error: (err) => {
        console.error('Error al eliminar amistad:', err);
        this.mostrarMensaje(err.error?.message || 'No se pudo eliminar la amistad', 'error');
      }
    });
  }

  abrirChat(amigo: IUser): void {
    this.router.navigate(['/chat', amigo.id]);
  }

  cambiarVista(vista: 'amigos' | 'solicitudes' | 'buscar' | 'bloqueados'): void {
    this.vistaActual = vista;
    if (vista === 'bloqueados') {
      this.cargarBloqueados();
    }
  }

  bloquearAmigo(amigo: IUser): void {
    this.blockedUserService.bloquearUsuario(amigo.id).subscribe({
      next: () => {
        this.mostrarMensaje(`${amigo.name} bloqueado`, 'info');
        this.cargarAmigos();
      },
      error: (err) => {
        console.error('Error al bloquear usuario:', err);
        this.mostrarMensaje(err.error?.message || 'No se pudo bloquear al usuario', 'error');
      }
    });
  }

  desbloquearAmigoDirecto(amigo: IUser): void {
    this.blockedUserService.desbloquearUsuario(amigo.id).subscribe({
      next: () => {
        this.mostrarMensaje(`${amigo.name} desbloqueado`, 'success');
        this.cargarAmigos();
      },
      error: (err) => {
        console.error('Error al desbloquear usuario:', err);
        this.mostrarMensaje('No se pudo desbloquear al usuario', 'error');
      }
    });
  }

  cargarBloqueados(): void {
    this.cargandoBloqueados = true;
    this.blockedUserService.listarBloqueados().subscribe({
      next: (data) => {
        this.usuariosBloqueados = data;
        this.cargandoBloqueados = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar bloqueados:', err);
        this.cargandoBloqueados = false;
        this.cdr.detectChanges();
      }
    });
  }

  desbloquearUsuario(bloqueado: IBlockedUser): void {
    this.blockedUserService.desbloquearUsuario(bloqueado.usuario.id).subscribe({
      next: () => {
        this.mostrarMensaje(`${bloqueado.usuario.name} desbloqueado`, 'success');
        this.cargarBloqueados();
      },
      error: (err) => {
        console.error('Error al desbloquear usuario:', err);
        this.mostrarMensaje('No se pudo desbloquear al usuario', 'error');
      }
    });
  }

  buscarUsuarios(): void {
    if (!this.busqueda || this.busqueda.trim().length < 1) {
      this.usuariosBuscados = [];
      return;
    }

    this.cargandoBusqueda = true;
    this.friendshipService.buscarUsuarios(this.busqueda).subscribe({
      next: (data) => {
        this.usuariosBuscados = data;
        this.cargandoBusqueda = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al buscar usuarios:', err);
        this.cargandoBusqueda = false;
        this.cdr.detectChanges();
      }
    });
  }

  enviarSolicitud(usuario: IUser): void {
    this.friendshipService.enviarSolicitud(usuario.id).subscribe({
      next: () => {
        this.mostrarMensaje(`¡Solicitud enviada a ${usuario.name}!`, 'success');
        this.buscarUsuarios();
      },
      error: (err) => {
        console.error('Error al enviar solicitud:', err);
        this.mostrarMensaje(err.error?.message || 'No se pudo enviar la solicitud', 'error');
      }
    });
  }

  navegarADeporte(ruta: string): void {
    this.router.navigate([ruta]);
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'info') {
    this.mensaje = texto;
    this.mensajeTipo = tipo;
    setTimeout(() => {
      this.mensaje = '';
    }, 4000);
  }
}

