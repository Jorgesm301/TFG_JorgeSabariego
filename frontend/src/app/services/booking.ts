import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IBooking {
  id?: number;
  deporte_id: number;
  creador_id?: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  pista: string;
  max_jugadores: number;
  jugadores_actuales: number;
  estado: 'abierto' | 'completo' | 'jugado' | 'cancelado';
  team_1_score?: number | null;
  team_2_score?: number | null;
  winner_team?: number | null;
  creador?: { id: number; name: string };
  usuarios?: { id: number; name: string }[];
  deporte?: { id: number; nombre: string; duracion_minutos: number };
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Obtener reservas de un deporte en una fecha específica
  getReservasPorDeporteYFecha(deporteId: number, fecha: string): Observable<IBooking[]> {
    return this.http.get<IBooking[]>(`${this.apiUrl}/bookings/deporte/${deporteId}/fecha/${fecha}`);
  }

  // Obtener reservas disponibles (abiertas) de un deporte
  getReservasDisponibles(deporteId: number): Observable<IBooking[]> {
    return this.http.get<IBooking[]>(`${this.apiUrl}/bookings/disponibles/${deporteId}`);
  }

  // Crear una nueva reserva
  crearReserva(reserva: Partial<IBooking>): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings`, reserva, { headers: this.getHeaders() });
  }

  // Unirse a una reserva existente
  unirseAReserva(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/unirse`, {}, { headers: this.getHeaders() });
  }

  // Salirse de una reserva
  salirseDeReserva(bookingId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bookings/${bookingId}/salir`, { headers: this.getHeaders() });
  }

  // Obtener mis reservas
  getMisReservas(): Observable<IBooking[]> {
    return this.http.get<IBooking[]>(`${this.apiUrl}/mis-bookings`, { headers: this.getHeaders() });
  }
}
