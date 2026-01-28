import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { EroService } from '../../services/ero.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuario: any = null;
  deportesEro: any[] = [];
  cargandoEro = false;
  totalPartidos = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private eroService: EroService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

    // Si no hay usuario, redirigir a login
    if (!this.usuario) {
      this.router.navigate(['/login']);
    } else {
      this.cargarEro();
    }
  }

  cargarEro(): void {
    this.cargandoEro = true;
    this.eroService.getMyEro().subscribe({
      next: (data) => {
        this.deportesEro = data.sports;
        this.totalPartidos = data.sports.reduce((sum: number, sport: any) => sum + sport.matches_played, 0);
        this.cargandoEro = false;
      },
      error: (err) => {
        console.error('Error al cargar ERO:', err);
        this.cargandoEro = false;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  volverInicio() {
    this.router.navigate(['/']);
  }
}
