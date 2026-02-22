import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  registroForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required]],
      ubicacion: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.authService.registrar(this.registroForm.value).subscribe({
        next: (res) => {
          alert('¡Usuario creado con exito!');

          //Para que el usuario no tenga que meter otra vez los datos
          this.authService.login({
            email: this.registroForm.value.email,
            password: this.registroForm.value.password
          }).subscribe({
            next: () => {
              this.router.navigate(['/']);
            },
            error: () => {
              this.router.navigate(['/login']);
            }
          });
        },
        error: (err) => {
          alert('Error al conectar con Laravel. Revisa la consola.');
          console.error(err);
        }
      });
    }
  }
}
