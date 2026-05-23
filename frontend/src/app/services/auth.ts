import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API_URL = 'http://localhost:8000/api';
  private TOKEN_KEY = 'auth_token';
  private USER_KEY = 'user_data';

  constructor(private http: HttpClient) { }

  registrar(usuario: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, usuario);
  }

  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credenciales).pipe(
      tap((response: any) => {
        if (response.access_token) {
          this.saveToken(response.access_token);
          this.saveUserData(response.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  saveUserData(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUserData(): any {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  updatePerfil(userData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/user/update`, userData).pipe(
      tap((response: any) => {
        if (response.user) {
          this.saveUserData(response.user);
        }
      })
    );
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/user/change-password`, passwordData);
  }

  verifyPassword(password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/user/verify-password`, { current_password: password });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.API_URL}/user/delete`);
  }

}
