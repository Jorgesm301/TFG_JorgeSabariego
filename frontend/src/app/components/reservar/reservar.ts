import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService, IBooking } from '../../services/booking';
import { SportsService, Sport } from '../../services/sports.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reservar',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reservar.html',
  styleUrl: './reservar.css',
})
export class Reservar implements OnInit {
  sportSlug: string = '';
  sport: Sport | null = null;


  modo: 'crear' | 'unirse' = 'crear';

  //Variables para crear reserva
  fechaSeleccionada: string = '';
  fechaMinima: string = '';
  fechaMaxima: string = '';
  horaSeleccionada: string = '';
  ubicacionSeleccionada: string = '';
  reservasDelDia: IBooking[] = [];
  horariosDisponibles: string[] = [];

  // Variables para unirse a reserva
  reservasDisponibles: IBooking[] = [];
  filtroUbicacion: string = '';

  mensaje: string = '';
  mensajeTipo: 'success' | 'error' | 'info' = 'info';
  cargando: boolean = false;

  menuReservarAbierto = false;
  deportesMenu = [
    { nombre: 'Fútbol', icon: '⚽', ruta: '/reservar/futbol'},
    { nombre: 'Fútbol Sala', icon: '⚽', ruta: '/reservar/futbol-sala'},
    { nombre: 'Baloncesto', icon: '🏀', ruta: '/reservar/baloncesto' },
    { nombre: 'Tenis', icon: '🎾', ruta: '/reservar/tenis' },
    { nombre: 'Pádel', icon: '🎾', ruta: '/reservar/padel' },
    { nombre: 'Voleibol', icon: '🏐', ruta: '/reservar/voleibol' },
    { nombre: 'Natación', icon: '🏊', ruta: '/reservar/natacion' },
    { nombre: 'Atletismo', icon: '🏃', ruta: '/reservar/atletismo' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private sportService: SportsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sportSlug = this.route.snapshot.params['deporte'];
    this.cargarSport();

    //Establecemos la fecha minima como hoy para no permitir reservas en el pasado y la fecha maxima como un mes desde hoy
    const hoy = new Date();
    this.fechaMinima = hoy.toISOString().split('T')[0];
    this.fechaSeleccionada = this.fechaMinima;

    const fechaMax = new Date();
    fechaMax.setMonth(fechaMax.getMonth() + 1);
    this.fechaMaxima = fechaMax.toISOString().split('T')[0];

    setTimeout(() => {
      if (this.cargando && !this.sport) {
        this.cargando = false;
        this.mostrarMensaje('Error: La carga del deporte tardó demasiado. Por favor, recarga la página.', 'error');
      }
    }, 10000);
  }

  // Normalizamos el texto quitandole tildes y caracteres especiales. Esto es para comparar el nombre del deporte con el slug de la URL.
  normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  cargarSport() {
    this.cargando = true;
    this.sportService.getSports().subscribe({
      next: (sports: Sport[]) => {

        this.sport = sports.find((d: Sport) =>
          this.normalizar(d.nombre) === this.sportSlug
        ) || null;

        if (!this.sport) {
          this.cargando = false;
          return;
        }

        this.generarHorarios();

        if (this.modo === 'crear') {
          this.cargarReservasDelDia();
        }
        // En modo unirse, no cargar automáticamente

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar deportes:', error);
        this.cargando = false;
        this.cdr.detectChanges();
        this.mostrarMensaje('Error al cargar los deportes', 'error');
      }
    });
  }

  generarHorarios() {
    this.horariosDisponibles = [];

    if (!this.sport) return;

    //Generamos los horarios desde las 9:00 hasta las 00:00 con la duracion de cada deporte.
    const duracionMinutos = this.sport.duracion_minutos;
    const horaInicio = 9 * 60;
    const horaFin = 24 * 60;


    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const esHoy = this.fechaSeleccionada === fechaHoy;

    //Obtenemos la hora actual en minutos
    let horaActualMinutos = 0;
    if (esHoy) {
      horaActualMinutos = hoy.getHours() * 60 + hoy.getMinutes();
    }

    let minutoActual = horaInicio;

    while (minutoActual + duracionMinutos <= horaFin) {
      //Si el dia es hoy, mostramos fechas desde este mismo momento hacia delante
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
      // No cargar reservas automáticamente, esperar a que el usuario busque
      this.reservasDisponibles = [];
      this.filtroUbicacion = '';
    }
  }

  onFechaChange() {
    this.horaSeleccionada = '';
    this.generarHorarios();
    this.cargarReservasDelDia();
  }

  onUbicacionChange() {
    this.horaSeleccionada = '';
    this.cargarReservasDelDia();
  }

  cargarReservasDelDia() {
    if (!this.sport || !this.fechaSeleccionada)
     return;

    this.bookingService.getReservasPorSportYFecha(this.sport.id, this.fechaSeleccionada)
      .subscribe({
        next: (reservas) => {
          // Filtramos solo las reservas de la misma ubicación si se ha seleccionado una
          if (this.ubicacionSeleccionada && this.ubicacionSeleccionada.trim() !== '') {
            this.reservasDelDia = reservas.filter(r =>
              r.ubicacion && r.ubicacion.toLowerCase().includes(this.ubicacionSeleccionada.toLowerCase())
            );
          } else {
            this.reservasDelDia = reservas;
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar reservas:', error);
        }
      });
  }

  cargarReservasDisponibles() {
    if (!this.sport) {
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.getReservasDisponibles(this.sport.id)
      .subscribe({
        next: (reservas) => {
          this.reservasDisponibles = reservas;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar reservas disponibles:', error);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  buscarPorUbicacion() {
    if (!this.sport) {
      return;
    }

    if (!this.filtroUbicacion || this.filtroUbicacion.trim() === '') {
      // Si no hay filtro, cargar todas las reservas disponibles
      this.cargarReservasDisponibles();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.getReservasPorUbicacion(this.sport.id, this.filtroUbicacion)
      .subscribe({
        next: (reservas) => {
          this.reservasDisponibles = reservas;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al buscar reservas por ubicación:', error);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  limpiarFiltro() {
    this.filtroUbicacion = '';
    this.reservasDisponibles = [];
  }

  estaOcupado(hora: string): boolean {
    if (!this.sport) return false;

    // Si no hay ubicación seleccionada, no marcamos nada como ocupado
    if (!this.ubicacionSeleccionada || this.ubicacionSeleccionada.trim() === '') {
      return false;
    }

    const [h, m] = hora.split(':').map(Number);
    const minutosSolicitud = h * 60 + m;
    const finSolicitud = minutosSolicitud + this.sport.duracion_minutos;

    const ocupado = this.reservasDelDia.some(reserva => {
      const [hInicio, mInicio] = reserva.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = reserva.hora_fin.split(':').map(Number);

      const inicioReserva = hInicio * 60 + mInicio;
      const finReserva = hFin * 60 + mFin;

      //Verificamos si se solapan los horarios, se solapan si el inicio de uno acaba despues del inicio del otro y antes del fin del otro.
      return minutosSolicitud < finReserva && finSolicitud > inicioReserva;
    });

    return ocupado;
  }

  calcularHoraFin(horaInicio: string): string {
    if (!this.sport)
      return horaInicio;

    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + this.sport.duracion_minutos;
    const horaFin = Math.floor(totalMinutos / 60);
    const minutosFin = totalMinutos % 60;
    return `${horaFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
  }

  crearReserva() {
    if (!this.authService.isAuthenticated()) {
      this.mostrarMensaje('Debes iniciar sesión para crear una reserva', 'error');
      setTimeout(() => {
        //Guardamos el URL actual para volver después del login
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url }
        });
      }, 1500);
      return;
    }

    if (!this.sport || !this.horaSeleccionada) {
      this.mostrarMensaje('Por favor selecciona una hora', 'error');
      return;
    }

    if (!this.ubicacionSeleccionada || this.ubicacionSeleccionada.trim() === '') {
      this.mostrarMensaje('Por favor selecciona una ubicación', 'error');
      return;
    }

    if (this.estaOcupado(this.horaSeleccionada)) {
      this.mostrarMensaje('Este horario ya está ocupado', 'error');
      return;
    }

    const reserva = {
      deporte_id: this.sport.id,
      fecha: this.fechaSeleccionada,
      hora_inicio: this.horaSeleccionada,
      ubicacion: this.ubicacionSeleccionada,
      pista: 'Pista 1'
    };

    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.crearReserva(reserva).subscribe({
      next: (response) => {
        this.mostrarMensaje('¡Reserva creada con éxito!', 'success');
        this.horaSeleccionada = '';


        if (response.booking) {
          this.reservasDelDia.push(response.booking);
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        const mensaje = error.error?.message || 'Error al crear la reserva';
        this.mostrarMensaje(mensaje, 'error');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  unirseAReserva(booking: IBooking) {
    if (!this.authService.isAuthenticated()) {
      this.mostrarMensaje('Debes iniciar sesión para unirte a un partido', 'error');
      setTimeout(() => {
        //Guardamos el URL actual para volver después del login
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url }
        });
      }, 1500);
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.unirseAReserva(booking.id!).subscribe({
      next: (response) => {
        this.mostrarMensaje('¡Te has unido a la reserva!', 'success');

        // Actualizar directamente la reserva en el array en lugar de recargar todo
        const index = this.reservasDisponibles.findIndex(r => r.id === booking.id);
        if (index !== -1 && response.booking) {
          this.reservasDisponibles[index] = response.booking;
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        const mensaje = error.error?.message || 'Error al unirse a la reserva';
        this.mostrarMensaje(mensaje, 'error');
        this.cargando = false;
        this.cdr.detectChanges();
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

  abrirMenuReservar() {
    this.menuReservarAbierto = true;
  }

  cerrarMenuReservar() {
    this.menuReservarAbierto = false;
  }

  navegarADeporte(ruta: string) {
    this.router.navigate([ruta]);
    this.menuReservarAbierto = false;
  }}
