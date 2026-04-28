import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth';
import { debounceTime, map, of, catchError, Observable } from 'rxjs';

@Component({
  selector: 'app-configurar-perfil',
  standalone: true,
  inputs: ['data', 'visible'],
  outputs: ['save', 'cancel'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './configurar-perfil.html',
  styleUrl: './configurar-perfil.css'
})
export class ConfigurarPerfilComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  cargando = false;
  errorMessage = '';
  successMessage = '';
  verificandoPassword = false;
  passwordValida: boolean | null = null;

  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  data: any = {};
  visible = false;
  activeTab: 'profile' | 'password' = 'profile';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: [this.data.name, [Validators.required, Validators.minLength(2)]],
      last_name: [this.data.last_name, [Validators.required, Validators.minLength(2)]],
      email: [this.data.email, [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required], [this.verifyCurrentPasswordValidator.bind(this)]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      new_password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.passwordForm.get('current_password')?.statusChanges.subscribe(() => {
      const currentPasswordControl = this.passwordForm.get('current_password');
      if (currentPasswordControl?.hasError('passwordInvalid')) {
        this.passwordValida = false;
      } else if (currentPasswordControl?.valid) {
        this.passwordValida = true;
      } else {
        this.passwordValida = null;
      }
    });
  }

  private verifyCurrentPasswordValidator(control: AbstractControl): Observable<any> {
    if (!control.value) {
      return of(null);
    }

    this.verificandoPassword = true;

    return this.authService.verifyPassword(control.value).pipe(
      debounceTime(500),
      map((response: any) => {
        this.verificandoPassword = false;
        if (response.valid) {
          return null; // Válida
        } else {
          return { passwordInvalid: true }; // Inválida
        }
      }),
      catchError(() => {
        this.verificandoPassword = false;
        return of({ passwordInvalid: true });
      })
    );
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('new_password')?.value;
    const confirmation = group.get('new_password_confirmation')?.value;
    return password === confirmation ? null : { passwordMismatch: true };
  }

  setActiveTab(tab: 'profile' | 'password'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordValida = null;
  }

  guardarPerfil(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    this.authService.updatePerfil(this.profileForm.value).subscribe({
      next: (response) => {
        this.cargando = false;
        this.successMessage = 'Perfil actualizado correctamente';
        setTimeout(() => {
          this.save.emit(response.user);
          this.cerrar();
        }, 1500);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.error.message || 'Error al actualizar el perfil';
        console.error('Error:', err);
      }
    });
  }

  guardarPassword(): void {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.hasError('passwordMismatch')) {
        this.errorMessage = 'Las contraseñas no coinciden';
      } else if (this.passwordForm.get('current_password')?.hasError('passwordInvalid')) {
        this.errorMessage = 'La contraseña actual es incorrecta';
      } else {
        this.errorMessage = 'Por favor completa todos los campos correctamente';
      }
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    const passwordData = {
      current_password: this.passwordForm.get('current_password')?.value,
      new_password: this.passwordForm.get('new_password')?.value,
      new_password_confirmation: this.passwordForm.get('new_password_confirmation')?.value
    };

    this.authService.changePassword(passwordData).subscribe({
      next: (response) => {
        this.cargando = false;
        this.successMessage = 'Contraseña actualizada correctamente';
        this.passwordForm.reset();
        this.passwordValida = null;
        setTimeout(() => {
          this.cerrar();
        }, 1500);
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = err.error.message || 'Error al cambiar la contraseña';
        console.error('Error:', err);
      }
    });
  }

  cancelar(): void {
    this.cancel.emit();
    this.cerrar();
  }

  private cerrar(): void {
    this.visible = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.activeTab = 'profile';
    this.passwordValida = null;
    this.profileForm.reset();
    this.passwordForm.reset();
  }
}
