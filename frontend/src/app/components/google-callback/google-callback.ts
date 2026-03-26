import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  template: `<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 18px; background: linear-gradient(135deg, #1976D2 0%, #42A5F5 100%); color: white; flex-direction: column; gap: 20px;">
    <p>Validando autenticación con Google</p>
    <p style="font-size: 14px; opacity: 0.8;">Por favor espera un momento</p>
  </div>`
})
export class GoogleCallback implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');

    if (!token || !email) {
      console.error('ERROR: No se recibió token o email desde Google');
      this.router.navigate(['/login'], {
        queryParams: { error: 'missing_params' }
      });
      return;
    }

    this.authService.saveToken(token);

    // Validamos el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<any>('http://localhost:8000/api/user', { headers }).subscribe({
      next: (userData) => {
        // Guardamos los datos completos del usuario desde el backend
        this.authService.saveUserData(userData);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('ERROR: Fallo validando token de Google -', error.status, error.message);

        this.authService.logout();

        this.router.navigate(['/login'], {
          queryParams: { error: 'google_validation_failed' }
        });
      }
    });
  }
}
