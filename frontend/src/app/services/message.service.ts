import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth';
import { IUser } from './friendship.service';

export interface IMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: IUser;
  receiver?: IUser;
}

export interface IConversation {
  amigo: IUser;
  ultimo_mensaje: IMessage;
  no_leidos: number;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
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

  // Enviar mensaje
  enviarMensaje(receiverId: number, mensaje: string): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.post(
      `${this.apiUrl}/messages`,
      { receiver_id: receiverId, message: mensaje },
      { headers }
    );
  }

  // Obtener conversación con un usuario
  obtenerConversacion(userId: number): Observable<IMessage[]> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.get<IMessage[]>(`${this.apiUrl}/messages/${userId}`, { headers });
  }

  // Listar todas las conversaciones
  listarConversaciones(): Observable<IConversation[]> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.get<IConversation[]>(`${this.apiUrl}/conversations`, { headers });
  }

  // Marcar mensaje como leído
  marcarComoLeido(messageId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.put(`${this.apiUrl}/messages/${messageId}/read`, {}, { headers });
  }

  // Marcar conversación completa como leída
  marcarConversacionLeida(userId: number): Observable<any> {
    let headers: HttpHeaders;
    try {
      headers = this.requireAuthHeaders();
    } catch (e: any) {
      return throwError(() => e);
    }
    return this.http.put(`${this.apiUrl}/messages/conversation/${userId}/read`, {}, { headers });
  }
}
