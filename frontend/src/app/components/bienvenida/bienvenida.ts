import { Component, OnDestroy, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';

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
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule
  ],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css'
})
export class Bienvenida implements OnInit, OnDestroy {
  private timerId: any;
  menuReservarAbierto = false;

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
    private authService: AuthService
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
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
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
