import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth';
import { IUser } from './friendship.service';

export interface IBlockedUser {
  id: number;
  usuario: IUser;
  bloqueado_en: string;
}

@Injectable({ providedIn: 'root' })
export class BlockedUserService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private requireAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    if (!token) {
      throw new Error('Debes iniciar sesión.');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Bloquear usuario
  bloquearUsuario(userId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.post(
      `${this.apiUrl}/blocked-users`,
      { blocked_user_id: userId },
      { headers }
    );
  }

  // Desbloquear usuario
  desbloquearUsuario(userId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.delete(`${this.apiUrl}/blocked-users/${userId}`, { headers });
  }

  // Listar usuarios bloqueados
  listarBloqueados(): Observable<IBlockedUser[]> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.get<IBlockedUser[]>(`${this.apiUrl}/blocked-users`, { headers });
  }
}
