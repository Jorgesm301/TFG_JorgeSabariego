import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { EloService } from '../../services/elo.service';

@Component({
  selector: 'app-elo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './elo.html',
  styleUrl: './elo.css',
})
export class Elo implements OnInit {
  deportesElo: any[] = [];
  cargandoElo = false;
  usuario: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private eloService: EloService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

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
        this.cargandoElo = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ELO:', err);
        this.cargandoElo = false;
      }
    });
  }

  volverPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}
