/**
 * Base HTTP Utility para centralizar manejo de headers con autenticación
 * Evita duplicación de código en servicios
 */
import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class HttpBaseService {

  constructor(private authService: AuthService) {}

  /**
   * Obtiene headers con autenticación (sin lanzar excepción)
   * @returns HttpHeaders | null
   */
  getAuthHeaders(): HttpHeaders | null {
    const token = this.authService.getToken();
    if (!token) return null;

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Obtiene headers con autenticación (lanza excepción si no hay token)
   * @returns HttpHeaders
   * @throws Error si no hay token de autenticación
   */
  requireAuthHeaders(): HttpHeaders {
    const headers = this.getAuthHeaders();
    if (!headers) {
      throw new Error('Debes iniciar sesión.');
    }
    return headers;
  }

  /**
   * Convierte un error HTTP a un mensaje legible
   * @param error objeto de error HTTP
   * @returns string mensaje de error
   */
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
