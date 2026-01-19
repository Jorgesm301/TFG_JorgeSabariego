import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

type Slide = {
  title: string;
  subtitle: string;
  imageUrl: string;
};

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css'
})
export class Bienvenida implements OnInit, OnDestroy {
  private timerId: any;

  slides: Slide[] = [
    {
      title: 'Pádel',
      subtitle: 'Reserva pista y encuentra partido',
      imageUrl: 'https://images.pexels.com/photos/32897040/pexels-photo-32897040.jpeg'
    },
    {
      title: 'Fútbol',
      subtitle: 'Únete a pachangas y completa equipos',
      imageUrl: 'https://images.pexels.com/photos/8941651/pexels-photo-8941651.jpeg'
    },
    {
      title: 'Basket',
      subtitle: 'Organiza partidos rápidos con tu nivel',
      imageUrl: 'https://images.pexels.com/photos/28776236/pexels-photo-28776236.jpeg'
    }
  ];

  currentIndex = 0;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

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
      this.cdr.detectChanges(); // <--- Forzamos actualización de la vista
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

  reservarAhora() {
    this.router.navigate(['/login']);
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
