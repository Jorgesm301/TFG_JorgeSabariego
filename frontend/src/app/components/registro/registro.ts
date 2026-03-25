import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  registroForm: FormGroup;
  registroError = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.registroError = '';
      this.isLoading = true;
      this.authService.registrar(this.registroForm.value).subscribe({
        next: (res) => {
          this.authService.login({
            email: this.registroForm.value.email,
            password: this.registroForm.value.password
          }).subscribe({
            next: () => {
              this.isLoading = false;
              this.router.navigate(['/']);
            },
            error: (err) => {
              this.isLoading = false;
              this.registroError = 'No se pudo iniciar sesión después del registro.';
              this.router.navigate(['/login']);
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 422) {
            const errors = err.error.errors;
            if (errors?.email) {
              this.registroError = 'Este email ya está registrado';
            } else {
              this.registroError = Object.values(errors || {}).flat().join(', ') as string;
            }
          } else if (err.status === 0) {
            this.registroError = 'No se pudo conectar con el servidor';
          } else {
            this.registroError = 'Error al crear la cuenta. Intenta de nuevo.';
          }
          console.error('Error al registrar:', err);
        }
      });
    }
  }

  registroConGoogle(): void {
    window.location.href = 'http://127.0.0.1:8000/auth/google/redirect';
  }
}
