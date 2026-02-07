import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService, IBooking } from '../../services/booking';
import { MatchService, IEquiposResponse, ICambioEro } from '../../services/match.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-partido-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './partido-detalle.html',
  styleUrl: './partido-detalle.css'
})
export class PartidoDetalle implements OnInit {
  bookingId: number | null = null;
  booking: IBooking | null = null;
  equipos: IEquiposResponse | null = null;
  cargando = false;
  error = '';
  generandoEquipos = false;
  registrandoResultado = false;
  scoreEquipo1: number = 0;
  scoreEquipo2: number = 0;

  //Para actualizar el ERO despues del resultado
  cambiosEro: ICambioEro[] = [];
  resultadoRegistrado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private matchService: MatchService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.bookingId = +params['id'];
      if (this.bookingId) {
        this.cargarDetalles();
      }
    });
  }

  cargarDetalles(): void {
    if (!this.bookingId)
       return;

    this.cargando = true;
    this.error = '';

    this.bookingService.getMisReservas().subscribe({
      next: (reservas) => {
        this.booking = reservas.find(r => r.id === this.bookingId) || null;

        if (this.booking && this.booking.estado !== 'abierto') {
          //Si esta completo el partido, generamos los equipos
          this.cargarEquipos();
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar detalles:', error);
        this.error = 'Error al cargar los detalles del partido';
        this.cargando = false;
      }
    });
  }

  cargarEquipos(): void {
    if (!this.bookingId)
       return;

    this.matchService.obtenerEquipos(this.bookingId).subscribe({
      next: (equipos) => {
        this.equipos = equipos;
        this.cdr.detectChanges();
      },
      error: (error) => {
        //Error por si no hay equipos generados.
        if (error.status !== 400) {
          console.error('Error al cargar equipos:', error);
        }
      }
    });
  }

  generarEquipos(): void {
    if (!this.bookingId || this.generandoEquipos)
       return;

    if (!confirm('¿Generar equipos equilibrados para este partido?')) {
      return;
    }

    this.generandoEquipos = true;
    this.error = '';

    this.matchService.generarEquipos(this.bookingId).subscribe({
      next: (response) => {
        console.log('Equipos generados:', response);
        alert('Equipos generados exitosamente');
        this.cargarEquipos();
        this.generandoEquipos = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al generar equipos:', error);
        this.error = error.error?.message || 'Error al generar equipos';
        this.generandoEquipos = false;
        this.cdr.detectChanges();
      }
    });
  }

  registrarResultado(): void {
    if (!this.bookingId || this.registrandoResultado)
      return;

    if (this.scoreEquipo1 < 0 || this.scoreEquipo2 < 0) {
      alert('Los marcadores no pueden ser negativos');
      return;
    }

    if (!confirm(`¿Registrar resultado ${this.scoreEquipo1} - ${this.scoreEquipo2}?`)) {
      return;
    }

    this.registrandoResultado = true;
    this.error = '';

    this.matchService.registrarResultado(this.bookingId, this.scoreEquipo1, this.scoreEquipo2).subscribe({
      next: (response) => {
        console.log('Resultado registrado:', response);
        this.cambiosEro = response.cambios_ero;
        this.resultadoRegistrado = true;

        // Actualizamos el booking con los nuevos datos
        if (this.booking) {
          this.booking.team_1_score = response.resultado.team_1_score;
          this.booking.team_2_score = response.resultado.team_2_score;
          this.booking.winner_team = response.resultado.winner_team;
          this.booking.estado = 'jugado';
        }

        this.registrandoResultado = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al registrar resultado:', error);
        this.error = error.error?.message || 'Error al registrar resultado';
        this.registrandoResultado = false;
        this.cdr.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/mis-reservas']);
  }

  get puedeGenerarEquipos(): boolean {
    return this.booking?.estado === 'completo' && !this.equipos;
  }

  get puedeRegistrarResultado(): boolean {
    return this.booking?.estado === 'completo' && !!this.equipos && !this.resultadoRegistrado;
  }

  get partidoJugado(): boolean {
    return this.booking?.estado === 'jugado';
  }

  calcularEroPromedio(equipo: any[]): number {
    if (!equipo || equipo.length === 0)
     return 1000;

    const suma = equipo.reduce((acc, j) => acc + (j.ero || 1000), 0);

    return Math.round(suma / equipo.length);
  }
}
