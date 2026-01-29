import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface IResultadoResponse {
  message: string;
  resultado: {
    team_1_score: number;
    team_2_score: number;
    winner_team: number | null;
  };
  cambios_ero: ICambioEro[];
}

export interface ICambioEro {
  id: number;
  name: string;
  team: number;
  nuevo_ero: number;
  partidos_jugados: number;
  gano: boolean;
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

@Injectable({
  providedIn: 'root',
})
export class MatchService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Generar equipos equilibrados para un partido
  generarEquipos(bookingId: number): Observable<IGenerarEquiposResponse> {
    return this.http.post<IGenerarEquiposResponse>(
      `${this.apiUrl}/matches/${bookingId}/generar-equipos`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Obtener los equipos de un partido
  obtenerEquipos(bookingId: number): Observable<IEquiposResponse> {
    return this.http.get<IEquiposResponse>(
      `${this.apiUrl}/matches/${bookingId}/equipos`,
      { headers: this.getHeaders() }
    );
  }

  // Registrar resultado de un partido
  registrarResultado(bookingId: number, team1Score: number, team2Score: number): Observable<IResultadoResponse> {
    return this.http.post<IResultadoResponse>(
      `${this.apiUrl}/matches/${bookingId}/resultado`,
      {
        team_1_score: team1Score,
        team_2_score: team2Score
      },
      { headers: this.getHeaders() }
    );
  }

  // Obtener historial de partidos jugados
  getHistorialPartidos(): Observable<IPartidoHistorial[]> {
    return this.http.get<IPartidoHistorial[]>(
      `${this.apiUrl}/mis-partidos`,
      { headers: this.getHeaders() }
    );
  }
}
