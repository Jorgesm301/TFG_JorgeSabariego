import { Component, OnDestroy, OnInit, ChangeDetectorRef, HostListener, AfterViewInit, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
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

