import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService, IBooking } from '../../services/booking';
import { DeportesService, Deporte } from '../../services/deportes.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reservar',
  imports: [CommonModule, FormsModule],
  templateUrl: './reservar.html',
  styleUrl: './reservar.css',
})
export class Reservar implements OnInit {
  deporteSlug: string = '';
  deporte: Deporte | null = null;

  // Modo: 'crear' o 'unirse'
  modo: 'crear' | 'unirse' = 'crear';

  // Para crear reserva
  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';
  reservasDelDia: IBooking[] = [];
  horariosDisponibles: string[] = [];

  // Para unirse a reserva
  reservasDisponibles: IBooking[] = [];

  mensaje: string = '';
  mensajeTipo: 'success' | 'error' | 'info' = 'info';
  cargando: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private deporteService: DeportesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.deporteSlug = this.route.snapshot.params['deporte'];
    this.cargarDeporte();

    // Establecer fecha mínima como hoy
    const hoy = new Date();
    this.fechaSeleccionada = hoy.toISOString().split('T')[0];
  }

  // Normalizar texto quitando tildes y caracteres especiales
  normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  cargarDeporte() {
    this.cargando = true;
    this.deporteService.getAllDeportes().subscribe({
      next: (deportes) => {
        // Buscar el deporte por el slug (nombre en la URL)
        this.deporte = deportes.find(d =>
          this.normalizar(d.nombre) === this.deporteSlug
        ) || null;

        if (!this.deporte) {
          console.error('Deporte no encontrado:', this.deporteSlug);
          console.log('Deportes disponibles:', deportes.map(d => this.normalizar(d.nombre)));
          this.router.navigate(['/']);
          return;
        }

        this.generarHorarios();
        this.cargarReservasDisponibles();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar deporte:', error);
        this.cargando = false;
        this.router.navigate(['/']);
      }
    });
  }

  generarHorarios() {
    this.horariosDisponibles = [];
    // Generar horarios de 8:00 a 22:00 cada 30 minutos
    for (let hora = 8; hora <= 22; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        this.horariosDisponibles.push(horaStr);
      }
    }
  }

  cambiarModo(nuevoModo: 'crear' | 'unirse') {
    this.modo = nuevoModo;
    this.mensaje = '';

    if (nuevoModo === 'crear') {
      this.cargarReservasDelDia();
    } else {
      this.cargarReservasDisponibles();
    }
  }

  onFechaChange() {
    this.horaSeleccionada = '';
    this.cargarReservasDelDia();
  }

  cargarReservasDelDia() {
    if (!this.deporte || !this.fechaSeleccionada) return;

    this.bookingService.getReservasPorDeporteYFecha(this.deporte.id, this.fechaSeleccionada)
      .subscribe({
        next: (reservas) => {
          this.reservasDelDia = reservas;
        },
        error: (error) => {
          console.error('Error al cargar reservas:', error);
        }
      });
  }

  cargarReservasDisponibles() {
    if (!this.deporte) return;

    this.bookingService.getReservasDisponibles(this.deporte.id)
      .subscribe({
        next: (reservas) => {
          this.reservasDisponibles = reservas;
        },
        error: (error) => {
          console.error('Error al cargar reservas disponibles:', error);
        }
      });
  }

  estaOcupado(hora: string): boolean {
    if (!this.deporte) return false;

    const [h, m] = hora.split(':').map(Number);
    const minutosSolicitud = h * 60 + m;
    const finSolicitud = minutosSolicitud + this.deporte.duracion_minutos;

    return this.reservasDelDia.some(reserva => {
      const [hInicio, mInicio] = reserva.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = reserva.hora_fin.split(':').map(Number);

      const inicioReserva = hInicio * 60 + mInicio;
      const finReserva = hFin * 60 + mFin;

      // Verificar solapamiento
      return (
        (minutosSolicitud >= inicioReserva && minutosSolicitud < finReserva) ||
        (finSolicitud > inicioReserva && finSolicitud <= finReserva) ||
        (minutosSolicitud <= inicioReserva && finSolicitud >= finReserva)
      );
    });
  }

  calcularHoraFin(horaInicio: string): string {
    if (!this.deporte) return horaInicio;

    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + this.deporte.duracion_minutos;
    const horaFin = Math.floor(totalMinutos / 60);
    const minutosFin = totalMinutos % 60;
    return `${horaFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
  }

  crearReserva() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.deporte || !this.horaSeleccionada) {
      this.mostrarMensaje('Por favor selecciona una hora', 'error');
      return;
    }

    if (this.estaOcupado(this.horaSeleccionada)) {
      this.mostrarMensaje('Este horario ya está ocupado', 'error');
      return;
    }

    const reserva = {
      deporte_id: this.deporte.id,
      fecha: this.fechaSeleccionada,
      hora_inicio: this.horaSeleccionada,
      pista: 'Pista 1'
    };

    this.cargando = true;
    this.bookingService.crearReserva(reserva).subscribe({
      next: (response) => {
        this.mostrarMensaje('¡Reserva creada con éxito!', 'success');
        this.horaSeleccionada = '';
        this.cargarReservasDelDia();
        this.cargando = false;
      },
      error: (error) => {
        const mensaje = error.error?.message || 'Error al crear la reserva';
        this.mostrarMensaje(mensaje, 'error');
        this.cargando = false;
      }
    });
  }

  unirseAReserva(booking: IBooking) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargando = true;
    this.bookingService.unirseAReserva(booking.id!).subscribe({
      next: (response) => {
        this.mostrarMensaje('¡Te has unido a la reserva!', 'success');
        this.cargarReservasDisponibles();
        this.cargando = false;
      },
      error: (error) => {
        const mensaje = error.error?.message || 'Error al unirse a la reserva';
        this.mostrarMensaje(mensaje, 'error');
        this.cargando = false;
      }
    });
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error' | 'info') {
    this.mensaje = texto;
    this.mensajeTipo = tipo;
    setTimeout(() => {
      this.mensaje = '';
    }, 4000);
  }

  volver() {
    this.router.navigate(['/']);
  }
}
