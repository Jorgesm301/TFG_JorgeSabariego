import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { EloService } from '../../services/elo.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  usuario: any = null;
  deportesElo: any[] = [];
  cargandoElo = false;
  totalPartidos = 0;

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
}
