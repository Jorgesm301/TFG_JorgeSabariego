import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { BookingService, IBooking } from '../../services/booking';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatDividerModule, MatProgressSpinnerModule,
    MatMenuModule, MatTooltipModule
  ],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.css'
})
export class MisReservas implements OnInit {
  usuario: any = null;
  reservas: IBooking[] = [];
  cargando: boolean = false;
  error: string = '';

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
}
