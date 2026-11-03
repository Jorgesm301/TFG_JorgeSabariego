//Lo uso para centralizar manejo de headers con autenticacion (token) y manejo de errores comunes
import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class HttpBaseService {

  constructor(private authService: AuthService) {}

  getAuthHeaders(): HttpHeaders | null {
    const token = this.authService.getToken();
    if (!token) return null;

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  requireAuthHeaders(): HttpHeaders {
    const headers = this.getAuthHeaders();
    if (!headers) {
      throw new Error('Debes iniciar sesión.');
    }
    return headers;
  }

  getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Error desconocido del servidor';
  }
}
