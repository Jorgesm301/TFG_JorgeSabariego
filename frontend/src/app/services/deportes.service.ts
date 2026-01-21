import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Deporte {
  id: number;
  nombre: string;
  descripcion?: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeportesService {
  private API_URL = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  // Obtener todos los deportes (público)
  getDeportes(): Observable<Deporte[]> {
    return this.http.get<Deporte[]>(`${this.API_URL}/deportes`);
  }

  // Obtener un deporte específico (público)
  getDeporte(id: number): Observable<Deporte> {
    return this.http.get<Deporte>(`${this.API_URL}/deportes/${id}`);
  }
}
