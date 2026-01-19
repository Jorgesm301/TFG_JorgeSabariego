import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

type Reserva = {
  id: number;
  deporte: string;
  fecha: string;
  hora: string;
  pista: string;
  estado: 'confirmada' | 'pendiente' | 'cancelada';
};

type Dia = {
  numero: number;
  nombre: string;
  esHoy: boolean;
  esSeleccionado: boolean;
  tieneFecha: boolean;
};

@Component({
  selector: 'app-pagina-principal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pagina-principal.html',
  styleUrl: './pagina-principal.css',
})
export class PaginaPrincipal implements OnInit {
  usuarioNombre = 'Jorge'; // Aquí después vendrá del servicio de autenticación

  mesActual = 'Enero 2026';
  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  dias: Dia[] = [];
  diaSeleccionado = 19;

  deportes = [
    { id: 1, nombre: 'Pádel', icon: '🎾', color: '#22c55e' },
    { id: 2, nombre: 'Fútbol', icon: '⚽', color: '#3b82f6' },
    { id: 3, nombre: 'Basket', icon: '🏀', color: '#f59e0b' },
    { id: 4, nombre: 'Tenis', icon: '🎾', color: '#ec4899' }
  ];

  deporteSeleccionado = 'Pádel';

  horariosDisponibles = [
    { hora: '09:00', pista: 'Pista 1', disponible: true },
    { hora: '10:00', pista: 'Pista 1', disponible: false },
    { hora: '11:00', pista: 'Pista 1', disponible: true },
    { hora: '12:00', pista: 'Pista 2', disponible: true },
    { hora: '16:00', pista: 'Pista 1', disponible: true },
    { hora: '17:00', pista: 'Pista 2', disponible: false },
    { hora: '18:00', pista: 'Pista 1', disponible: true },
    { hora: '19:00', pista: 'Pista 2', disponible: true }
  ];

  misReservas: Reserva[] = [
    {
      id: 1,
      deporte: 'Pádel',
      fecha: '19 Ene',
      hora: '18:00',
      pista: 'Pista 1',
      estado: 'confirmada'
    },
    {
      id: 2,
      deporte: 'Fútbol',
      fecha: '21 Ene',
      hora: '17:00',
      pista: 'Campo A',
      estado: 'confirmada'
    },
    {
      id: 3,
      deporte: 'Basket',
      fecha: '23 Ene',
      hora: '20:00',
      pista: 'Cancha 1',
      estado: 'pendiente'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.generarCalendario();
  }

  generarCalendario(): void {
    const hoy = 19;
    for (let i = 1; i <= 31; i++) {
      this.dias.push({
        numero: i,
        nombre: this.diasSemana[(i - 1) % 7],
        esHoy: i === hoy,
        esSeleccionado: i === this.diaSeleccionado,
        tieneFecha: i >= hoy
      });
    }
  }

  seleccionarDia(dia: Dia): void {
    if (dia.tieneFecha) {
      this.dias.forEach(d => d.esSeleccionado = false);
      dia.esSeleccionado = true;
      this.diaSeleccionado = dia.numero;
    }
  }

  seleccionarDeporte(deporte: string): void {
    this.deporteSeleccionado = deporte;
  }

  reservarHorario(horario: any): void {
    if (horario.disponible) {
      alert(`Reservando ${this.deporteSeleccionado} - ${horario.hora} - ${horario.pista}`);
      // Aquí irá la lógica para crear la reserva
    }
  }

  cancelarReserva(reserva: Reserva): void {
    if (confirm(`¿Cancelar reserva de ${reserva.deporte} el ${reserva.fecha} a las ${reserva.hora}?`)) {
      reserva.estado = 'cancelada';
    }
  }

  cerrarSesion(): void {
    // Aquí irá la lógica de cerrar sesión
    this.router.navigate(['/']);
  }
}
