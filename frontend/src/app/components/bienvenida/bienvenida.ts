import { Component, OnDestroy, OnInit } from '@angular/core';
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
      imageUrl: 'https://images.unsplash.com/photo-1620761151994-9a4a3f2e9f77?auto=format&fit=crop&w=1400&q=80'
    },
    {
      title: 'Fútbol',
      subtitle: 'Únete a pachangas y completa equipos',
      imageUrl: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80'
    },
    {
      title: 'Basket',
      subtitle: 'Organiza partidos rápidos con tu nivel',
      imageUrl: 'https://images.unsplash.com/photo-1519861155730-0b5fbf0dd889?auto=format&fit=crop&w=1400&q=80'
    }
  ];

  currentIndex = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.nextSlide();
    }, 4500); // cambia cada 4.5s
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  reservarAhora() {
    // si todavía no tienes /reservas, lo normal es enviar al login
    this.router.navigate(['/login']);
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
  }

  goTo(i: number) {
    this.currentIndex = i;
  }
}
