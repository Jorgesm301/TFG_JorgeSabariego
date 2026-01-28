import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EroService {
  private API_URL = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  /**
   * Obtener el ERO del usuario autenticado
   */
  getMyEro(): Observable<any> {
    return this.http.get(`${this.API_URL}/me/ero`);
  }
}
