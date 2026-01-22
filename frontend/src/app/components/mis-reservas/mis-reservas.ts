import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { BookingService, IBooking } from '../../services/booking';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.css'
})
export class MisReservas implements OnInit {
  usuario: any = null;
  reservas: IBooking[] = [];
  cargando: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private bookingService: BookingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

    // Si no hay usuario, redirigir a login
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargarReservas();
  }

  cargarReservas() {
    console.log('=== CARGANDO MIS RESERVAS ===');
    console.log('Usuario:', this.usuario);
    console.log('Token:', localStorage.getItem('token'));

    this.cargando = true;
    this.error = '';

    this.bookingService.getMisReservas().subscribe({
      next: (reservas) => {
        console.log('Reservas recibidas:', reservas);
        this.reservas = reservas;
        this.cargando = false;
        this.cdr.detectChanges();
        console.log('Cargando actualizado, cargando =', this.cargando);
      },
      error: (error) => {
        console.error('Error al cargar reservas:', error);
        console.error('Status:', error.status);
        console.error('Error completo:', error);
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
        console.log('Salida exitosa:', response);
        alert(response.message || 'Has salido de la reserva exitosamente');
        this.cargarReservas(); // Recargar lista
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
}
