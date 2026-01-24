import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  fechaMaxima: string = '';
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
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.deporteSlug = this.route.snapshot.params['deporte'];
    console.log('=== INICIO ngOnInit ===');
    console.log('Slug del deporte:', this.deporteSlug);

    this.cargarDeporte();

    // Establecer fecha mínima como hoy
    const hoy = new Date();
    this.fechaSeleccionada = hoy.toISOString().split('T')[0];

    // Establecer fecha máxima como 1 mes desde hoy
    const fechaMax = new Date();
    fechaMax.setMonth(fechaMax.getMonth() + 1);
    this.fechaMaxima = fechaMax.toISOString().split('T')[0];

    // Timeout de seguridad
    setTimeout(() => {
      if (this.cargando && !this.deporte) {
        console.error('TIMEOUT: La carga del deporte tardó demasiado');
        this.cargando = false;
        this.mostrarMensaje('Error: La carga del deporte tardó demasiado. Por favor, recarga la página.', 'error');
      }
    }, 10000); // 10 segundos
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
        console.log('Deportes recibidos del backend:', deportes);
        console.log('Buscando slug:', this.deporteSlug);
        console.log('Deportes normalizados:', deportes.map(d => ({
          original: d.nombre,
          normalizado: this.normalizar(d.nombre)
        })));

        // Buscar el deporte por el slug (nombre en la URL)
        this.deporte = deportes.find(d =>
          this.normalizar(d.nombre) === this.deporteSlug
        ) || null;

        if (!this.deporte) {
          console.error('Deporte no encontrado:', this.deporteSlug);
          console.log('Deportes disponibles:', deportes.map(d => this.normalizar(d.nombre)));
          this.cargando = false;
          // No redirigir, mostrar mensaje de error
          return;
        }

        console.log('Deporte encontrado:', this.deporte);
        this.generarHorarios();
        // Solo cargar reservas disponibles si estamos en modo "unirse"
        if (this.modo === 'unirse') {
          this.cargarReservasDisponibles();
        }

        // Asegurarse de que el flag de cargando se actualice y forzar detección de cambios
        this.cargando = false;
        this.cdr.detectChanges();
        console.log('Cargando deporte completado, cargando =', this.cargando);
      },
      error: (error) => {
        console.error('Error al cargar deportes:', error);
        this.cargando = false;
        this.cdr.detectChanges();
        this.mostrarMensaje('Error al cargar los deportes', 'error');
      }
    });
  }

  generarHorarios() {
    this.horariosDisponibles = [];

    if (!this.deporte) return;

    // Generar horarios desde las 9:00 hasta las 00:00
    // Los horarios se generan según la duración del deporte
    const duracionMinutos = this.deporte.duracion_minutos;
    const horaInicio = 9 * 60; // 9:00 en minutos
    const horaFin = 24 * 60; // 00:00 (medianoche) en minutos

    // Verificar si la fecha seleccionada es hoy
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const esHoy = this.fechaSeleccionada === fechaHoy;

    // Obtener hora actual en minutos
    let horaActualMinutos = 0;
    if (esHoy) {
      horaActualMinutos = hoy.getHours() * 60 + hoy.getMinutes();
    }

    let minutoActual = horaInicio;

    while (minutoActual + duracionMinutos <= horaFin) {
      // Si es hoy, solo mostrar horarios futuros
      if (!esHoy || minutoActual > horaActualMinutos) {
        const hora = Math.floor(minutoActual / 60);
        const minuto = minutoActual % 60;
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
        this.horariosDisponibles.push(horaStr);
      }

      minutoActual += duracionMinutos;
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

      // Verificar solapamiento: dos intervalos se solapan si uno empieza antes de que termine el otro
      // Solapamiento ocurre si: inicio1 < fin2 Y fin1 > inicio2
      return minutosSolicitud < finReserva && finSolicitud > inicioReserva;
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
    console.log('=== CREAR RESERVA ===');
    console.log('Autenticado:', this.authService.isAuthenticated());

    if (!this.authService.isAuthenticated()) {
      console.log('Usuario no autenticado, redirigiendo a login');
      this.mostrarMensaje('Debes iniciar sesión para crear una reserva', 'error');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
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

    console.log('Creando reserva con datos:', reserva);
    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.crearReserva(reserva).subscribe({
      next: (response) => {
        console.log('Reserva creada exitosamente:', response);
        this.mostrarMensaje('¡Reserva creada con éxito!', 'success');
        this.horaSeleccionada = '';

        // Agregar la reserva directamente al array en lugar de hacer otra petición
        if (response.booking) {
          this.reservasDelDia.push(response.booking);
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al crear reserva:', error);
        console.error('Status:', error.status);
        console.error('Error completo:', error);
        const mensaje = error.error?.message || 'Error al crear la reserva';
        this.mostrarMensaje(mensaje, 'error');
        this.cargando = false;
        this.cdr.detectChanges();
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

        // Actualizar directamente la reserva en el array en lugar de recargar todo
        const index = this.reservasDisponibles.findIndex(r => r.id === booking.id);
        if (index !== -1 && response.booking) {
          this.reservasDisponibles[index] = response.booking;
        }

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
