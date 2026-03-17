import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { HttpBaseService } from '../utils/http-base.service';

export interface IEquipo {
  id: number;
  name: string;
  elo: number;
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
  elo_promedio_equipo_1: number;
  elo_promedio_equipo_2: number;
}

export interface ICambioElo {
  id: number;
  name: string;
  team: number;
  nuevo_elo: number;
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
  cambios_elo: ICambioElo[];
}

export interface IPartidoHistorial {
  id: number;
  sport: string;
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

  constructor(private http: HttpClient, private httpBase: HttpBaseService) {}

  generarEquipos(bookingId: number): Observable<IGenerarEquiposResponse> {
    let headers: HttpHeaders;
    try { headers = this.httpBase.requireAuthHeaders(); } catch (e: any) { return throwError(() => e); }

    return this.http.post<IGenerarEquiposResponse>(
      `${this.apiUrl}/matches/${bookingId}/generar-equipos`,
      {},
      { headers }
    );
  }

  obtenerEquipos(bookingId: number): Observable<IEquiposResponse> {
    let headers: HttpHeaders;
    try { headers = this.httpBase.requireAuthHeaders(); } catch (e: any) { return throwError(() => e); }

    return this.http.get<IEquiposResponse>(
      `${this.apiUrl}/matches/${bookingId}/equipos`,
      { headers }
    );
  }

  registrarResultado(bookingId: number, team1Score: number, team2Score: number): Observable<IResultadoResponse> {
    let headers: HttpHeaders;
    try { headers = this.httpBase.requireAuthHeaders(); } catch (e: any) { return throwError(() => e); }

    return this.http.post<IResultadoResponse>(
      `${this.apiUrl}/matches/${bookingId}/resultado`,
      { team_1_score: team1Score, team_2_score: team2Score },
      { headers }
    );
  }

  getHistorialPartidos(): Observable<IPartidoHistorial[]> {
    let headers: HttpHeaders;
    try { headers = this.httpBase.requireAuthHeaders(); } catch (e: any) { return throwError(() => e); }

    return this.http.get<IPartidoHistorial[]>(
      `${this.apiUrl}/mis-partidos`,
      { headers }
    );
  }
}
