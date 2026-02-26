import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { EloService } from '../../services/elo.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuario: any = null;
  deportesElo: any[] = [];
  cargandoElo = false;
  totalPartidos = 0;
  editandoUbicacion = false;
  nuevaUbicacion = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private eloService: EloService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

    //Si no esta registrado el usuario, redirigimos al login
    if (!this.usuario) {
      this.router.navigate(['/login']);
    } else {
      this.cargarElo();
    }
  }

  cargarElo(): void {
    this.cargandoElo = true;
    this.eloService.getMyElo().subscribe({
      next: (data) => {
        this.deportesElo = data.sports;
        this.totalPartidos = data.sports.reduce((sum: number, sport: any) => sum + sport.matches_played, 0);
        this.cargandoElo = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ELO:', err);
        this.cargandoElo = false;
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

  editarUbicacion() {
    this.nuevaUbicacion = this.usuario?.ubicacion || '';
    this.editandoUbicacion = true;
  }

  guardarUbicacion() {
    this.authService.updateProfile({ ubicacion: this.nuevaUbicacion }).subscribe({
      next: (response) => {
        this.usuario = response.user;
        this.authService.saveUserData(this.usuario);
        this.editandoUbicacion = false;
        this.cdr.detectChanges();
        alert('¡Ubicación actualizada correctamente!');
      },
      error: (err) => {
        console.error('Error al actualizar ubicación:', err);
        alert('Error al actualizar la ubicación');
      }
    });
  }

  cancelarEdicion() {
    this.editandoUbicacion = false;
    this.nuevaUbicacion = '';
  }
}
