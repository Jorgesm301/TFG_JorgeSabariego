import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Asegúrate de que esta URL coincida con donde corre tu Laravel
  private API_URL = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  registrar(usuario: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, usuario);
  }
}
