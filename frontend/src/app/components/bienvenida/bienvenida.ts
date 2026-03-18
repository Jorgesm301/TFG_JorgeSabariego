import { Component, OnDestroy, OnInit, ChangeDetectorRef, HostListener, AfterViewInit, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { BookingService, IBooking } from '../../services/booking';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';
import { SharedMessagesDrawerComponent } from '../shared/shared-messages-drawer/shared-messages-drawer';

type Slide = {
  title: string;
  subtitle: string;
  imageUrl: string;
};

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedPageHeaderComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SharedMessagesDrawerComponent
  ],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css'
})
export class Bienvenida implements OnInit, OnDestroy, AfterViewInit {
  private timerId: any;
  menuReservarAbierto = false;
  currentYear = new Date().getFullYear();
  private observer?: IntersectionObserver;

  // Mensajería
  drawerAbierto = false;
  conversaciones: IConversation[] = [];
  cargandoConversaciones = false;
  private intervaloMensajes: any;

  // Nuevo mensaje
  modoNuevoMensaje = false;
  amigos: IUser[] = [];
  cargandoAmigos = false;

  // Próximo partido y calendario
  proximoPartido: IBooking | null = null;
  misPartidos: IBooking[] = [];
  cargandoPartidos = false;
  partidosPorDia: Map<string, IBooking[]> = new Map();

  // Calendario visual
  mesActual = new Date().getMonth();
  añoActual = new Date().getFullYear();
  diaHoy = new Date().getDate();
  mesHoy = new Date().getMonth();
  añoHoy = new Date().getFullYear();
  diasCalendario: (number | null)[] = [];
  nombreMes = '';

  deportesMenu = [

    { nombre: 'Fútbol', icon: 'sports_soccer', ruta: '/reservar/futbol'},
    { nombre: 'Fútbol Sala', icon: 'sports_soccer', ruta: '/reservar/futbol-sala'},
    { nombre: 'Baloncesto', icon: 'sports_basketball', ruta: '/reservar/baloncesto' },
    { nombre: 'Tenis', icon: 'sports_tennis', ruta: '/reservar/tenis' },
    { nombre: 'Pádel', icon: 'sports_tennis', ruta: '/reservar/padel' },
    { nombre: 'Voleibol', icon: 'sports_volleyball', ruta: '/reservar/voleibol' },
    { nombre: 'Natación', icon: 'pool', ruta: '/reservar/natacion' },
    { nombre: 'Atletismo', icon: 'directions_run', ruta: '/reservar/atletismo' }
  ];

  slides: Slide[] = [
    {
      title: 'Fútbol',
      subtitle: 'Únete a pachangas y completa equipos',
      imageUrl: 'https://images.pexels.com/photos/8941651/pexels-photo-8941651.jpeg'
    },
    {
      title: 'Fútbol Sala',
      subtitle: 'Partidos en pista cubierta',
      imageUrl: 'https://images.pexels.com/photos/16378321/pexels-photo-16378321.jpeg'
    },
    {
      title: 'Baloncesto',
      subtitle: 'Organiza partidos rápidos con tu nivel',
      imageUrl: 'https://images.pexels.com/photos/28776236/pexels-photo-28776236.jpeg'
    },
    {
      title: 'Pádel',
      subtitle: 'Reserva pista y encuentra partido',
      imageUrl: 'https://images.pexels.com/photos/32897040/pexels-photo-32897040.jpeg'
    },
    {
      title: 'Tenis',
      subtitle: 'Encuentra rivales de tu nivel',
      imageUrl: 'https://images.pexels.com/photos/34015718/pexels-photo-34015718.jpeg'
    },
    {
      title: 'Voleibol',
      subtitle: 'Completa equipos y juega en red',
      imageUrl: 'https://images.pexels.com/photos/30307748/pexels-photo-30307748.jpeg'
    },
    {
      title: 'Natación',
      subtitle: 'Reserva carriles para entrenar',
      imageUrl: 'https://images.pexels.com/photos/8688137/pexels-photo-8688137.jpeg'
    },
    {
      title: 'Atletismo',
      subtitle: 'Acceso a pista y entrenamiento grupal',
      imageUrl: 'https://images.pexels.com/photos/34523833/pexels-photo-34523833.jpeg'
    }
  ];

  currentIndex = 0;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private messageService: MessageService,
    private friendshipService: FriendshipService,
    private bookingService: BookingService,
    private el: ElementRef
  ) {}

  //Verificamos si el usuario esta logeado
  get estaLogueado(): boolean {
    return this.authService.isAuthenticated();
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
  }

  ngOnInit(): void {
    this.startAutoSlide();
    if (this.estaLogueado) {
      this.cargarConversaciones();
      this.iniciarActualizacionMensajes();
      this.cargarMisPartidos();
      // Recargar partidos cada 60 segundos
      setInterval(() => {
        if (this.estaLogueado) {
          this.cargarMisPartidos();
        }
      }, 60000);
    }
  }

  ngAfterViewInit(): void {
    this.setupScrollAnimations();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
    this.observer?.disconnect();
    if (this.intervaloMensajes) {
      clearInterval(this.intervaloMensajes);
    }
  }

  // ===== PARTIDOS =====
  cargarMisPartidos(): void {
    this.cargandoPartidos = true;
    this.bookingService.getMisReservas().subscribe({
      next: (partidos) => {
        // Filtrar solo los partidos canceleados
        this.misPartidos = partidos.filter(p => p.estado !== 'cancelado' && p.fecha);
        console.log('Partidos cargados:', this.misPartidos);
        this.obtenerProximoPartido();
        this.agruparPartidosPorDia();
        this.cargandoPartidos = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar partidos:', err);
        this.cargandoPartidos = false;
        this.cdr.detectChanges();
      }
    });
  }

  obtenerProximoPartido(): void {
    const ahora = new Date();

    // Primero intenta buscar partidos futuros
    let proximoPartido = this.misPartidos
      .filter(p => new Date(`${p.fecha}T${p.hora_inicio}`) >= ahora)
      .sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora_inicio}`).getTime();
        const fechaB = new Date(`${b.fecha}T${b.hora_inicio}`).getTime();
        return fechaA - fechaB;
      })[0];

    // Si no hay partidos futuros, muestra el más reciente
    if (!proximoPartido && this.misPartidos.length > 0) {
      proximoPartido = this.misPartidos
        .sort((a, b) => {
          const fechaA = new Date(`${a.fecha}T${a.hora_inicio}`).getTime();
          const fechaB = new Date(`${b.fecha}T${b.hora_inicio}`).getTime();
          return fechaB - fechaA; // Descendente (más reciente primero)
        })[0];
    }

    this.proximoPartido = proximoPartido || null;
  }

  agruparPartidosPorDia(): void {
    this.partidosPorDia.clear();
    this.misPartidos.forEach(partido => {
      // Normalizar la fecha: si tiene hora, extraer solo la parte YYYY-MM-DD
      const fechaNormalizada = partido.fecha.split('T')[0];
      if (!this.partidosPorDia.has(fechaNormalizada)) {
        this.partidosPorDia.set(fechaNormalizada, []);
      }
      this.partidosPorDia.get(fechaNormalizada)?.push(partido);
    });
    console.log('Partidos agrupados:', Array.from(this.partidosPorDia.entries()));
    this.generarCalendario();
  }

  generarCalendario(): void {
    const primerDia = new Date(this.añoActual, this.mesActual, 1);
    const ultimoDia = new Date(this.añoActual, this.mesActual + 1, 0);

    this.diasCalendario = [];

    // Agregar SOLO los días del mes actual (sin días anteriores/posteriores)
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      this.diasCalendario.push(i);
    }

    // Actualizar nombre del mes
    const opciones: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    this.nombreMes = primerDia.toLocaleDateString('es-ES', opciones);
  }

  cambiarMes(direccion: number): void {
    const nuevoMes = this.mesActual + direccion;
    const nuevoAño = this.mesActual + direccion > 11 ? this.añoActual + 1 :
                    this.mesActual + direccion < 0 ? this.añoActual - 1 : this.añoActual;

    // No permitir ir a marzo atrás (antes del mes actual)
    if (nuevoMes < this.mesHoy && nuevoAño === this.añoHoy) {
      return; // No ir atrás del mes actual
    }

    // No permitir ir más de 1 mes adelante
    if (nuevoMes > this.mesHoy + 1 && nuevoAño === this.añoHoy) {
      return; // No ir más de 1 mes adelante
    }

    this.mesActual = nuevoMes > 11 ? 0 : nuevoMes < 0 ? 11 : nuevoMes;
    this.añoActual = nuevoAño;
    this.generarCalendario();
  }

  puedeIrAdelante(): boolean {
    // Puedes ir adelante si no estás en el mes siguiente al actual
    return !(this.mesActual > this.mesHoy || this.añoActual > this.añoHoy);
  }

  puedeIrAtras(): boolean {
    // Puedes ir atrás si no estás en el mes actual
    return !(this.mesActual === this.mesHoy && this.añoActual === this.añoHoy);
  }

  obtenerFechaCalendario(dia: number | null): string | null {
    if (dia === null) return null;
    const mes = String(this.mesActual + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    return `${this.añoActual}-${mes}-${diaStr}`;
  }

  tienePartidoEnDia(dia: number | null): boolean {
    const fecha = this.obtenerFechaCalendario(dia);
    const tiene = fecha !== null && this.partidosPorDia.has(fecha) && this.partidosPorDia.get(fecha)!.length > 0;
    if (tiene) {
      console.log(`Día ${dia} tiene partido (fecha: ${fecha})`);
    }
    return tiene;
  }

  getPartidosPorDia(dia: number | null): IBooking[] {
    const fecha = this.obtenerFechaCalendario(dia);
    return fecha ? this.partidosPorDia.get(fecha) || [] : [];
  }

  esHoy(dia: number | null): boolean {
    return dia === this.diaHoy && this.mesActual === this.mesHoy;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(`${fecha}T00:00:00`);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  formatearHora(hora: string): string {
    return hora.substring(0, 5);
  }

  irAPartidoDetalle(bookingId: number): void {
    this.router.navigate(['/partido-detalle', bookingId]);
  }

  refrescarPartidos(): void {
    console.log('Refrescando partidos...');
    this.cargarMisPartidos();
  }

  private setupScrollAnimations(): void {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    const elements = this.el.nativeElement.querySelectorAll('.animate-on-scroll');
    elements.forEach((el: Element) => this.observer?.observe(el));
  }

  // ===== MENSAJERÍA =====
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
    // Actualizar cada 30 segundos
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

  private startAutoSlide(): void {
    this.stopAutoSlide();
    this.timerId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.slides.length;
      this.cdr.detectChanges();
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
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

  cerrarMenus() {
    this.menuReservarAbierto = false;
  }

  navegarADeporte(ruta: string) {
    this.cerrarMenus();
    this.router.navigate([ruta]);
  }

  nextSlide() {
    this.stopAutoSlide();
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.startAutoSlide();
  }

  prevSlide() {
    this.stopAutoSlide();
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.startAutoSlide();
  }

  goTo(i: number) {
    this.stopAutoSlide();
    this.currentIndex = i;
    this.startAutoSlide();
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }
}

