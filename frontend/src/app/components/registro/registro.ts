import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth'; // Verifica que la ruta al servicio sea correcta

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registro.html', // He quitado el .component para que coincida con tus archivos
  styleUrl: './registro.css'
})
export class Registro { // Dejamos el nombre "Registro" como en tu imagen
  registroForm: FormGroup;

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
      this.authService.registrar(this.registroForm.value).subscribe({
        next: (res) => {
          alert('¡Usuario creado con éxito!');
          // Hacer login automático después del registro
          this.authService.login({
            email: this.registroForm.value.email,
            password: this.registroForm.value.password
          }).subscribe({
            next: () => {
              this.router.navigate(['/']); // Ir a bienvenida
            },
            error: () => {
              this.router.navigate(['/login']); // Si falla, ir a login
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
