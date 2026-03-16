import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { BookingService, IBooking } from '../../services/booking';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';
import { SharedMessagesDrawerComponent } from '../shared/shared-messages-drawer/shared-messages-drawer';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    SharedPageHeaderComponent, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule,
    MatMenuModule, MatTooltipModule, MatListModule, SharedMessagesDrawerComponent
  ],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.css'
})
export class MisReservas implements OnInit {
  usuario: any = null;
  reservas: IBooking[] = [];
  cargando: boolean = false;
  error: string = '';

  drawerAbierto = false;
  conversaciones: IConversation[] = [];
  cargandoConversaciones = false;
  private intervaloMensajes: any;

  modoNuevoMensaje = false;
  amigos: IUser[] = [];
  cargandoAmigos = false;

  deportesMenu = [
    { nombre: 'Fútbol', icon: 'sports_soccer', ruta: '/reservar/futbol' },
    { nombre: 'Fútbol Sala', icon: 'sports_soccer', ruta: '/reservar/futbol-sala' },
    { nombre: 'Baloncesto', icon: 'sports_basketball', ruta: '/reservar/baloncesto' },
    { nombre: 'Tenis', icon: 'sports_tennis', ruta: '/reservar/tenis' },
    { nombre: 'Pádel', icon: 'sports_tennis', ruta: '/reservar/padel' },
    { nombre: 'Voleibol', icon: 'sports_volleyball', ruta: '/reservar/voleibol' },
    { nombre: 'Natación', icon: 'pool', ruta: '/reservar/natacion' },
    { nombre: 'Atletismo', icon: 'directions_run', ruta: '/reservar/atletismo' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private bookingService: BookingService,
    private messageService: MessageService,
    private friendshipService: FriendshipService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

    //Si no hay usuario, redirigir a login
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarReservas();
    this.cargarConversaciones();
    this.iniciarActualizacionMensajes();
  }

  ngOnDestroy(): void {
    if (this.intervaloMensajes) {
      clearInterval(this.intervaloMensajes);
    }
  }

  cargarReservas() {

    this.cargando = true;
    this.error = '';

    this.bookingService.getMisReservas().subscribe({
      next: (reservas) => {
        this.reservas = reservas;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = error.error?.message || 'Error al cargar tus reservas';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  salirseDeReserva(booking: IBooking) {
    if (!confirm('¿Estás seguro de que quieres salir de esta reserva?')) {
      return;
    }

    this.bookingService.salirseDeReserva(booking.id!).subscribe({
      next: (response) => {
        alert(response.message || 'Has salido de la reserva exitosamente');
        this.cargarReservas();
      },
      error: (error) => {
        console.error('Error al salir de la reserva:', error);
        alert(error.error?.message || 'Error al salir de la reserva');
      }
    });
  }

  volverInicio() {
    this.router.navigate(['/']);
  }

  get estaLogueado(): boolean {
    return this.authService.isAuthenticated();
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  navegarADeporte(ruta: string) {
    this.router.navigate([ruta]);
  }

  cargarConversaciones(): void {
    if (!this.estaLogueado) return;

    this.cargandoConversaciones = true;
    this.messageService.listarConversaciones().subscribe({
      next: (data) => {
        this.conversaciones = data;
        this.cargandoConversaciones = false;
        this.cdr.detectChanges();
      },
      error: () => {
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
    this.cargarAmigos();
  }

  volverAConversaciones(): void {
    this.modoNuevoMensaje = false;
  }

  cargarAmigos(): void {
    this.cargandoAmigos = true;
    this.friendshipService.listarAmigos().subscribe({
      next: (data) => {
        this.amigos = data;
        this.cargandoAmigos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoAmigos = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirChat(amigoId: number): void {
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
}

