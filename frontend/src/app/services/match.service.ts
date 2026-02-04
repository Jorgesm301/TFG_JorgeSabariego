import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth';

export interface IEquipo {
  id: number;
  name: string;
  ero: number;
}

export interface IEquiposResponse {
  equipo_1: IEquipo[];
  equipo_2: IEquipo[];
  team_1_score?: number | null;
  team_2_score?: number | null;
  winner_team?: number | null;
  estado: string;
}

export interface IGenerarEquiposResponse {
  message: string;
  equipo_1: IEquipo[];
  equipo_2: IEquipo[];
  ero_promedio_equipo_1: number;
  ero_promedio_equipo_2: number;
}

export interface ICambioEro {
  id: number;
  name: string;
  team: number;
  nuevo_ero: number;
  partidos_jugados: number;
  gano: boolean;
}

export interface IResultadoResponse {
  message: string;
  resultado: {
    team_1_score: number;
    team_2_score: number;
    winner_team: number | null;
  };
  cambios_ero: ICambioEro[];
}

export interface IPartidoHistorial {
  id: number;
  deporte: string;
  fecha: string;
  hora: string;
  mi_equipo: number;
  resultado: string;
  gane: boolean;
  empate: boolean;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headersOrThrow(): HttpHeaders {
    const token = this.auth.getToken(); // ✅ usa auth_token
    if (!token) throw new Error('Debes iniciar sesión.');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  generarEquipos(bookingId: number): Observable<IGenerarEquiposResponse> {
    let headers: HttpHeaders;
    try { headers = this.headersOrThrow(); } catch (e: any) { return throwError(() => e); }

    return this.http.post<IGenerarEquiposResponse>(
      `${this.apiUrl}/matches/${bookingId}/generar-equipos`,
      {},
      { headers }
    );
  }

  obtenerEquipos(bookingId: number): Observable<IEquiposResponse> {
    let headers: HttpHeaders;
    try { headers = this.headersOrThrow(); } catch (e: any) { return throwError(() => e); }

    return this.http.get<IEquiposResponse>(
      `${this.apiUrl}/matches/${bookingId}/equipos`,
      { headers }
    );
  }

  registrarResultado(bookingId: number, team1Score: number, team2Score: number): Observable<IResultadoResponse> {
    let headers: HttpHeaders;
    try { headers = this.headersOrThrow(); } catch (e: any) { return throwError(() => e); }

    return this.http.post<IResultadoResponse>(
      `${this.apiUrl}/matches/${bookingId}/resultado`,
      { team_1_score: team1Score, team_2_score: team2Score },
      { headers }
    );
  }

  getHistorialPartidos(): Observable<IPartidoHistorial[]> {
    let headers: HttpHeaders;
    try { headers = this.headersOrThrow(); } catch (e: any) { return throwError(() => e); }

    return this.http.get<IPartidoHistorial[]>(
      `${this.apiUrl}/mis-partidos`,
      { headers }
    );
  }
}
