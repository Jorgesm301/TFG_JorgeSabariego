import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Sport {
  id: number;
  nombre: string;
  max_jugadores: number;
  duracion_minutos: number;
  descripcion?: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SportsService {
  private API_URL = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  getSports(): Observable<Sport[]> {
    return this.http.get<Sport[]>(`${this.API_URL}/sports`);
  }

  getSport(id: number): Observable<Sport> {
    return this.http.get<Sport>(`${this.API_URL}/sports/${id}`);
  }
}
