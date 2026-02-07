import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth';

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
  estado: 'abierto' | 'completo' | 'cancelado' | 'jugado';
  creador?: { id: number; name: string };
  usuarios?: { id: number; name: string }[];
  sport?: { id: number; nombre: string; duracion_minutos: number };
  team_1_score?: number | null;
  team_2_score?: number | null;
  winner_team?: number | null;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeadersOrNull(): HttpHeaders | null {
    const token = this.auth.getToken();
    if (!token) return null;

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private requireAuthHeaders(): HttpHeaders {
    const headers = this.authHeadersOrNull();
    if (!headers) {
      // error controlable desde el subscribe()
      throw new Error('Debes iniciar sesión.');
    }
    return headers;
  }

  // Endpoints públicos
  getReservasPorSportYFecha(sportId: number, fecha: string): Observable<IBooking[]> {
    return this.http.get<IBooking[]>(
      `${this.apiUrl}/bookings/sport/${sportId}/fecha/${fecha}`
    );
  }

  getReservasDisponibles(sportId: number): Observable<IBooking[]> {
    return this.http.get<IBooking[]>(
      `${this.apiUrl}/bookings/disponibles/${sportId}`
    );
  }

  // Endpoints protegidos
  crearReserva(reserva: Partial<IBooking>): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.post(`${this.apiUrl}/bookings`, reserva, { headers });
  }

  unirseAReserva(bookingId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/unirse`, {}, { headers });
  }

  salirseDeReserva(bookingId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.delete(`${this.apiUrl}/bookings/${bookingId}/salir`, { headers });
  }

  getMisReservas(): Observable<IBooking[]> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.get<IBooking[]>(`${this.apiUrl}/mis-bookings`, { headers });
  }
}
