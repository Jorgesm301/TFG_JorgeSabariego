import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth';

export interface IUser {
  id: number;
  name: string;
  last_name?: string;
  email: string;
  relacion?: 'none' | 'pending' | 'accepted' | 'blocked';
  esta_bloqueado?: boolean;
}

export interface IFriendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: IUser;
  friend?: IUser;
}

@Injectable({ providedIn: 'root' })
export class FriendshipService {
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

  enviarSolicitud(friendId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.post(`${this.apiUrl}/friendships`, { friend_id: friendId }, { headers });
  }

  aceptarSolicitud(friendshipId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.put(`${this.apiUrl}/friendships/${friendshipId}/accept`, {}, { headers });
  }

  rechazarSolicitud(friendshipId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.put(`${this.apiUrl}/friendships/${friendshipId}/reject`, {}, { headers });
  }

  listarAmigos(): Observable<IUser[]> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.get<IUser[]>(`${this.apiUrl}/friends`, { headers });
  }

  listarSolicitudesPendientes(): Observable<IFriendship[]> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.get<IFriendship[]>(`${this.apiUrl}/friend-requests`, { headers });
  }

  eliminarAmistad(friendshipId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.delete(`${this.apiUrl}/friendships/${friendshipId}`, { headers });
  }

  eliminarAmigoPorUserId(friendId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.delete(`${this.apiUrl}/friends/${friendId}`, { headers });
  }

  buscarUsuarios(query: string): Observable<IUser[]> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.get<IUser[]>(`${this.apiUrl}/users/search?query=${encodeURIComponent(query)}`, { headers });
  }
}
