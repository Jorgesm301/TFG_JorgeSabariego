import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService, IBooking } from '../../services/booking';
import { SportsService, Sport } from '../../services/sports.service';
import { AuthService } from '../../services/auth';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';

@Component({
  selector: 'app-reservar',
  imports: [
    CommonModule, FormsModule, RouterModule,
    SharedPageHeaderComponent, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatChipsModule, MatListModule,
    MatDividerModule, MatMenuModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule, MatBadgeModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './reservar.html',
  styleUrl: './reservar.css',
})
export class Reservar implements OnInit, OnDestroy {
  sportSlug: string = '';
  sport: Sport | null = null;

  modo: 'crear' | 'unirse' = 'crear';

  // Variables para crear reserva
  fechaSeleccionada: string = '';
  fechaSeleccionadaDate: Date | null = null;
  fechaMinimaDate: Date | null = null;
  fechaMaximaDate: Date | null = null;
  horaSeleccionada: string = '';
  ubicacionSeleccionada: string = '';
  reservasDelDia: IBooking[] = [];
  horariosDisponibles: string[] = [];

  // Variables para unirse a reserva
  reservasDisponibles: IBooking[] = [];
  filtroUbicacion: string = '';

  // Variables para geolocalización y búsqueda por radio
  miLatitud: number | null = null;
  miLongitud: number | null = null;
  usarGeolocalizacion: boolean = false;
  radioBusqueda: number = 10; // Radio en kilómetros
  radiosDisponibles = [5, 10, 25, 50, 100];
  geolocalizacionActiva: boolean = false;

  // Variables para crear reserva con ubicación
  latitudReserva: number | null = null;
  longitudReserva: number | null = null;
  ubicacionAutomatica: boolean = false;

  // Debounce geocoding manual
  geocodingTimeout: any = null;

  // Mensajeria
  drawerAbierto = false;
  conversaciones: IConversation[] = [];
  cargandoConversaciones = false;
  private intervaloMensajes: any;

  // Nuevo mensaje
  modoNuevoMensaje = false;
  amigos: IUser[] = [];
  cargandoAmigos = false;

  // ⚠️ Ajusta el puerto si tu Laravel corre en otro
  private readonly backendUrl = 'http://127.0.0.1:8000';

  mensaje: string = '';
  mensajeTipo: 'success' | 'error' | 'info' = 'info';
  cargando: boolean = false;

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
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private sportService: SportsService,
    private authService: AuthService,
    private messageService: MessageService,
    private friendshipService: FriendshipService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.sportSlug = this.route.snapshot.params['deporte'];

    // Fecha mínima hoy y máxima un mes
    const hoy = this.normalizarFecha(new Date());
    this.fechaMinimaDate = hoy;
    this.fechaSeleccionadaDate = hoy;
    this.fechaSeleccionada = this.formatearFechaLocal(hoy);

    const fechaMax = new Date(hoy);
    fechaMax.setMonth(fechaMax.getMonth() + 1);
    this.fechaMaximaDate = this.normalizarFecha(fechaMax);

    this.cargarSport();

    if (this.estaLogueado) {
      this.cargarConversaciones();
      this.iniciarActualizacionMensajes();
    }

    setTimeout(() => {
      if (this.cargando && !this.sport) {
        this.cargando = false;
        this.mostrarMensaje('Error: La carga del deporte tardó demasiado. Por favor, recarga la página.', 'error');
      }
    }, 10000);
  }

  ngOnDestroy() {
    if (this.geocodingTimeout) {
      clearTimeout(this.geocodingTimeout);
    }

    if (this.intervaloMensajes) {
      clearInterval(this.intervaloMensajes);
    }
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
      error: (err) => {
        console.error('Error al cargar amigos:', err);
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
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  }

  // Normalizamos el texto (tildes, espacios, etc.)
  normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  private normalizarFecha(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private formatearFechaLocal(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parsearFechaLocal(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  get fechaSeleccionadaFormateada(): string {
    if (!this.fechaSeleccionada) {
      return '';
    }

    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(this.parsearFechaLocal(this.fechaSeleccionada));
  }

  cargarSport() {
    this.cargando = true;
    this.sportService.getSports().subscribe({
      next: (sports: Sport[]) => {
        this.sport = sports.find((d: Sport) => this.normalizar(d.nombre) === this.sportSlug) || null;

        if (!this.sport) {
          this.cargando = false;
          return;
        }

        this.generarHorarios();

        if (this.modo === 'crear') {
          this.cargarReservasDelDia();
        }

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

    const duracionMinutos = this.sport.duracion_minutos;
    const horaInicio = 9 * 60;
    const horaFin = 24 * 60;

    const hoy = new Date();
    const fechaHoy = this.formatearFechaLocal(hoy);
    const esHoy = this.fechaSeleccionada === fechaHoy;

    let horaActualMinutos = 0;
    if (esHoy) {
      horaActualMinutos = hoy.getHours() * 60 + hoy.getMinutes();
    }

    let minutoActual = horaInicio;
    while (minutoActual + duracionMinutos <= horaFin) {
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
      this.reservasDisponibles = [];
      this.filtroUbicacion = '';
    }
  }

  onFechaChange(date?: Date | null) {
    if (date) {
      const fechaNormalizada = this.normalizarFecha(date);
      this.fechaSeleccionadaDate = fechaNormalizada;
      this.fechaSeleccionada = this.formatearFechaLocal(fechaNormalizada);
    }

    this.horaSeleccionada = '';
    this.generarHorarios();
    this.cargarReservasDelDia();
  }

  onUbicacionChange() {
    this.horaSeleccionada = '';
    this.cargarReservasDelDia();

    // Manual: geocodificar texto con debounce
    if (!this.ubicacionAutomatica && this.ubicacionSeleccionada && this.ubicacionSeleccionada.trim() !== '') {
      // ✅ Evita coords viejas si falla el geocode
      this.latitudReserva = null;
      this.longitudReserva = null;

      if (this.geocodingTimeout) clearTimeout(this.geocodingTimeout);

      this.geocodingTimeout = setTimeout(async () => {
        console.log('🔵 Geocodificando ubicación manual:', this.ubicacionSeleccionada);
        const coords = await this.geocode(this.ubicacionSeleccionada);

        if (coords) {
          this.latitudReserva = coords.lat;
          this.longitudReserva = coords.lon;
          console.log('✅ Coordenadas obtenidas para ubicación manual:', coords);
        } else {
          console.log('⚠️ No se pudieron obtener coordenadas para:', this.ubicacionSeleccionada);
        }

        this.cdr.detectChanges();
      }, 1000);

    } else if (!this.ubicacionSeleccionada || this.ubicacionSeleccionada.trim() === '') {
      // Si se borra el campo, limpiar coords (si no es GPS)
      if (!this.ubicacionAutomatica) {
        this.latitudReserva = null;
        this.longitudReserva = null;
      }
    }
  }

  cargarReservasDelDia() {
    if (!this.sport || !this.fechaSeleccionada) return;

    this.bookingService.getReservasPorSportYFecha(this.sport.id, this.fechaSeleccionada)
      .subscribe({
        next: (reservas) => {
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
    if (!this.sport) return;

    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.getReservasDisponibles(this.sport.id).subscribe({
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
    if (!this.sport) return;

    if (!this.filtroUbicacion || this.filtroUbicacion.trim() === '') {
      this.cargarReservasDisponibles();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.getReservasPorUbicacion(this.sport.id, this.filtroUbicacion).subscribe({
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

  // Ubicación del navegador (para buscar por radio)
  obtenerUbicacion() {
    if (!navigator.geolocation) {
      this.mostrarMensaje('Tu navegador no soporta geolocalización', 'error');
      return;
    }

    this.cargando = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.miLatitud = position.coords.latitude;
        this.miLongitud = position.coords.longitude;
        this.geolocalizacionActiva = true;
        this.cargando = false;
        this.mostrarMensaje('Ubicación obtenida correctamente', 'success');
        this.cdr.detectChanges();
      },
      (error) => {
        this.cargando = false;
        this.geolocalizacionActiva = false;
        console.error('Error al obtener ubicación:', error);
        this.mostrarMensaje('No se pudo obtener tu ubicación. Verifica los permisos.', 'error');
        this.cdr.detectChanges();
      }
    );
  }

  buscarPorRadio() {
    if (!this.sport) return;

    if (this.miLatitud === null || this.miLongitud === null) {
      this.mostrarMensaje('Primero activa tu ubicación', 'error');
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.getReservasPorRadio(
      this.sport.id,
      this.miLatitud,
      this.miLongitud,
      this.radioBusqueda
    ).subscribe({
      next: (reservas) => {
        this.reservasDisponibles = reservas;
        this.cargando = false;
        this.cdr.detectChanges();

        if (reservas.length === 0) {
          this.mostrarMensaje(`No se encontraron partidos en un radio de ${this.radioBusqueda}km`, 'info');
        }
      },
      error: (error) => {
        console.error('Error al buscar reservas por radio:', error);
        this.cargando = false;
        this.mostrarMensaje('Error al buscar partidos cercanos', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // Reverse geocoding (coords -> texto). Si en algún momento te da CORS, lo pasamos al backend también.
  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`;
      const response = await fetch(url);
      const data = await response.json();

      const address = data.address;
      const parts: string[] = [];

      if (address?.road) parts.push(address.road);
      if (address?.city) parts.push(address.city);
      if (address?.town) parts.push(address.town);
      if (address?.village) parts.push(address.village);
      if (address?.state) parts.push(address.state);

      return parts.length > 0 ? parts.join(', ') : (data.display_name || 'Ubicación detectada');
    } catch (error) {
      console.error('Error en reverse geocoding:', error);
      return 'Ubicación desconocida';
    }
  }

  // ✅ Geocoding (texto -> coords) usando TU backend (evita CORS)
  async geocode(address: string): Promise<{ lat: number, lon: number } | null> {
    try {
      const url = `${this.backendUrl}/api/geocode?q=${encodeURIComponent(address)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.found) {
        return { lat: data.lat, lon: data.lng };
      }
      return null;
    } catch (error) {
      console.error('Error en geocoding (backend):', error);
      return null;
    }
  }

  toggleUbicacionAutomatica() {
    console.log('🔵 toggleUbicacionAutomatica llamado. Estado actual:', this.ubicacionAutomatica);

    if (this.ubicacionAutomatica) {
      // Activar GPS
      if (!navigator.geolocation) {
        this.mostrarMensaje('Tu navegador no soporta geolocalización', 'error');
        this.ubicacionAutomatica = false;
        return;
      }

      this.cargando = true;
      console.log('🔵 Solicitando geolocalización...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.latitudReserva = position.coords.latitude;
          this.longitudReserva = position.coords.longitude;

          console.log('✅ Coordenadas obtenidas:', {
            latitud: this.latitudReserva,
            longitud: this.longitudReserva
          });

          const direccion = await this.reverseGeocode(this.latitudReserva, this.longitudReserva);
          this.ubicacionSeleccionada = direccion;

          this.cargando = false;
          console.log('✅ Ubicación completa:', direccion);
          this.mostrarMensaje('Ubicación obtenida correctamente', 'success');
          this.cdr.detectChanges();
        },
        (error) => {
          this.cargando = false;
          this.ubicacionAutomatica = false;
          this.latitudReserva = null;
          this.longitudReserva = null;
          console.error('❌ Error al obtener ubicación:', error);
          this.mostrarMensaje('No se pudo obtener tu ubicación', 'error');
          this.cdr.detectChanges();
        }
      );
    } else {
      // Desactivar GPS
      this.latitudReserva = null;
      this.longitudReserva = null;

      //Limpiamos el texto para evitar que se quede la direccion automatica
      this.ubicacionSeleccionada = '';
      console.log('🔴 Ubicación automática desactivada');
      this.mostrarMensaje('Ubicación automática desactivada', 'info');
    }
  }

  estaOcupado(hora: string): boolean {
    if (!this.sport) return false;

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

      return minutosSolicitud < finReserva && finSolicitud > inicioReserva;
    });

    return ocupado;
  }

  calcularHoraFin(horaInicio: string): string {
    if (!this.sport) return horaInicio;

    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + this.sport.duracion_minutos;
    const horaFin = Math.floor(totalMinutos / 60);
    const minutosFin = totalMinutos % 60;
    return `${horaFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
  }

  // ✅ IMPORTANTE: ahora es async para poder hacer geocode final si hace falta
  async crearReserva() {
    if (!this.authService.isAuthenticated()) {
      this.mostrarMensaje('Debes iniciar sesión para crear una reserva', 'error');
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
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

    // ✅ Si NO es GPS, asegúrate de que hay coords (geocode final obligatorio)
    if (!this.ubicacionAutomatica) {
      if (this.latitudReserva === null || this.longitudReserva === null) {
        const coords = await this.geocode(this.ubicacionSeleccionada);
        if (!coords) {
          this.mostrarMensaje('No se pudo encontrar esa ubicación. Prueba con "Barcelona, España"', 'error');
          return;
        }
        this.latitudReserva = coords.lat;
        this.longitudReserva = coords.lon;
      }
    }

    const reserva: any = {
      deporte_id: this.sport.id,
      fecha: this.fechaSeleccionada,
      hora_inicio: this.horaSeleccionada,
      ubicacion: this.ubicacionSeleccionada,
      pista: 'Pista 1'
    };

    console.log('🔵 Verificando coordenadas:', {
      latitudReserva: this.latitudReserva,
      longitudReserva: this.longitudReserva,
      ubicacionAutomatica: this.ubicacionAutomatica
    });

    if (this.latitudReserva !== null && this.longitudReserva !== null) {
      reserva.latitud = this.latitudReserva;
      reserva.longitud = this.longitudReserva;
      console.log('✅ Coordenadas añadidas a la reserva');
    } else {
      console.log('⚠️ No se añaden coordenadas (están en null)');
    }

    console.log('🔵 Objeto reserva que se enviará:', reserva);

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
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      }, 1500);
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.bookingService.unirseAReserva(booking.id!).subscribe({
      next: (response) => {
        this.mostrarMensaje('¡Te has unido a la reserva!', 'success');

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

  navegarADeporte(ruta: string) {
    this.router.navigate([ruta]);
  }

  getSportMatIcon(): string {
    const iconMap: Record<string, string> = {
      'futbol': 'sports_soccer',
      'futbol-sala': 'sports_soccer',
      'baloncesto': 'sports_basketball',
      'tenis': 'sports_tennis',
      'padel': 'sports_tennis',
      'voleibol': 'sports_volleyball',
      'natacion': 'pool',
      'atletismo': 'directions_run'
    };
    return iconMap[this.sportSlug] || 'sports';
  }
}

