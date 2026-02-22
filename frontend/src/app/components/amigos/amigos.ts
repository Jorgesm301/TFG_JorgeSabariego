import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { FriendshipService, IUser, IFriendship } from '../../services/friendship.service';
import { BlockedUserService, IBlockedUser } from '../../services/blocked-user.service';

@Component({
  selector: 'app-amigos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './amigos.html',
  styleUrl: './amigos.css'
})
export class Amigos implements OnInit {
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
  vistaActual: 'amigos' | 'solicitudes' | 'buscar' | 'bloqueados' = 'amigos';
  mostrandoMenuAmigo: number | null = null;

  constructor(
    private authService: AuthService,
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
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error('Error al rechazar solicitud:', err);
        alert('No se pudo rechazar la solicitud');
      }
    });
  }

  eliminarAmigo(amigo: IUser): void {
    if (!confirm(`¿Estás seguro de eliminar a ${amigo.name} de tus amigos?`)) {
      return;
    }

    this.friendshipService.eliminarAmigoPorUserId(amigo.id).subscribe({
      next: () => {
        alert(`Has eliminado a ${amigo.name} de tus amigos`);
        this.cargarAmigos();
        this.mostrandoMenuAmigo = null;
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

  toggleMenuAmigo(amigoId: number): void {
    this.mostrandoMenuAmigo = this.mostrandoMenuAmigo === amigoId ? null : amigoId;
  }

  bloquearAmigo(amigo: IUser): void {
    if (!confirm(`¿Estás seguro de bloquear a ${amigo.name}? Seguiréis siendo amigos pero no podréis comunicaros hasta que lo desbloquees.`)) {
      return;
    }

    this.blockedUserService.bloquearUsuario(amigo.id).subscribe({
      next: () => {
        alert(`Has bloqueado a ${amigo.name}. La amistad se mantiene pero no podrán comunicarse.`);
        this.cargarAmigos();
        this.mostrandoMenuAmigo = null;
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
        alert(`Has desbloqueado a ${amigo.name}. Ya podéis comunicaros de nuevo.`);
        this.cargarAmigos();
        this.mostrandoMenuAmigo = null;
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
        alert(`Has desbloqueado a ${bloqueado.usuario.name}. Ya podéis comunicaros de nuevo.`);
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
        this.buscarUsuarios(); // Recargar resultados
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
}
