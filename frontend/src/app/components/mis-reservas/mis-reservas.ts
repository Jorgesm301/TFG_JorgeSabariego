import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.css'
})
export class MisReservas implements OnInit {
  usuario: any = null;
  reservas: any[] = []; // Aquí irán las reservas desde la BD

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

    // Si no hay usuario, redirigir a login
    if (!this.usuario) {
      this.router.navigate(['/login']);
      return;
    }

    // TODO: Aquí cargarás las reservas desde el backend
    // this.cargarReservas();
  }

  volverInicio() {
    this.router.navigate(['/']);
  }
}
