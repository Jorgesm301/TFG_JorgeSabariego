import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { EroService } from '../../services/ero.service';

@Component({
  selector: 'app-ero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ero.html',
  styleUrl: './ero.css',
})
export class Ero implements OnInit {
  deportesEro: any[] = [];
  cargandoEro = false;
  usuario: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private eroService: EroService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

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
        this.cargandoEro = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ERO:', err);
        this.cargandoEro = false;
      }
    });
  }

  volverPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}
