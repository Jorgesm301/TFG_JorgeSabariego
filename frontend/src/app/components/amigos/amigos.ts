import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { FriendshipService, IUser, IFriendship } from '../../services/friendship.service';

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
  busqueda: string = '';
  cargando = false;
  cargandoSolicitudes = false;
  cargandoBusqueda = false;
  error = '';
  vistaActual: 'amigos' | 'solicitudes' | 'buscar' = 'amigos';

  constructor(
    private authService: AuthService,
    private friendshipService: FriendshipService,
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

  eliminarAmigo(amigo: IUser, friendshipId: number): void {
    if (!confirm(`¿Estás seguro de eliminar a ${amigo.name} de tus amigos?`)) {
      return;
    }

    this.friendshipService.eliminarAmistad(friendshipId).subscribe({
      next: () => {
        this.cargarAmigos();
      },
      error: (err) => {
        console.error('Error al eliminar amistad:', err);
        alert('No se pudo eliminar la amistad');
      }
    });
  }

  abrirChat(amigo: IUser): void {
    this.router.navigate(['/chat', amigo.id]);
  }

  cambiarVista(vista: 'amigos' | 'solicitudes' | 'buscar'): void {
    this.vistaActual = vista;
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

  // Obtener el ID de la amistad para eliminar
  // Necesitamos hacer una llamada adicional o guardar esta info
  // Por simplicidad, asumimos que podemos eliminarlo por el ID del amigo
  // En producción, deberías obtener el friendshipId correctamente
}
