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

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
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
        alert('Solicitud aceptada');
        this.cargarAmigos();
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error('Error al aceptar solicitud:', err);
        alert('No se pudo aceptar la solicitud');
      }
    });
  }

  rechazarSolicitud(solicitud: IFriendship): void {
    this.friendshipService.rechazarSolicitud(solicitud.id).subscribe({
      next: () => {
        alert('Solicitud rechazada');
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error('Error al rechazar solicitud:', err);
        alert('No se pudo rechazar la solicitud');
      }
    });
  }

  eliminarAmigo(amigo: IUser): void {
    if (!confirm(`¿Eliminar a ${amigo.name} de tus amigos?`)) {
      return;
    }

    this.friendshipService.eliminarAmigoPorUserId(amigo.id).subscribe({
      next: () => {
        alert(`${amigo.name} eliminado de tus amigos`);
        this.cargarAmigos();
      },
      error: (err) => {
        console.error('Error al eliminar amistad:', err);
        alert(err.error?.message || 'No se pudo eliminar la amistad');
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
    if (!confirm(`¿Estás seguro de bloquear a ${amigo.name}? No podréis comunicaros hasta que lo desbloquees.`)) {
      return;
    }

    this.blockedUserService.bloquearUsuario(amigo.id).subscribe({
      next: () => {
        alert(`${amigo.name} bloqueado`);
        this.cargarAmigos();
      },
      error: (err) => {
        console.error('Error al bloquear usuario:', err);
        alert(err.error?.message || 'No se pudo bloquear al usuario');
      }
    });
  }

  desbloquearAmigoDirecto(amigo: IUser): void {
    if (!confirm(`¿Desbloquear a ${amigo.name}? Podrán volver a comunicarse.`)) {
      return;
    }

    this.blockedUserService.desbloquearUsuario(amigo.id).subscribe({
      next: () => {
        alert(`${amigo.name} desbloqueado`);
        this.cargarAmigos();
      },
      error: (err) => {
        console.error('Error al desbloquear usuario:', err);
        alert('No se pudo desbloquear al usuario');
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
    if (!confirm(`¿Desbloquear a ${bloqueado.usuario.name}? Podrán volver a comunicarse y la amistad se restaurará.`)) {
      return;
    }

    this.blockedUserService.desbloquearUsuario(bloqueado.usuario.id).subscribe({
      next: () => {
        alert(`${bloqueado.usuario.name} desbloqueado`);
        this.cargarBloqueados();
      },
      error: (err) => {
        console.error('Error al desbloquear usuario:', err);
        alert('No se pudo desbloquear al usuario');
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
        alert(`Solicitud enviada a ${usuario.name}`);
        this.buscarUsuarios();
      },
      error: (err) => {
        console.error('Error al enviar solicitud:', err);
        alert(err.error?.message || 'No se pudo enviar la solicitud');
      }
    });
  }

  volverInicio(): void {
    this.router.navigate(['/']);
  }

  navegarADeporte(ruta: string): void {
    this.router.navigate([ruta]);
  }
}

