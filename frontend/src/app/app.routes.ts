import { Routes } from '@angular/router';
import { Registro } from './components/registro/registro';
import { Login } from './components/login/login';
import { Bienvenida } from './components/bienvenida/bienvenida';
import { Perfil } from './components/perfil/perfil';
import { MisReservas } from './components/mis-reservas/mis-reservas';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Bienvenida }, // Página principal - se adapta según autenticación
  { path: 'login', component: Login }, // Login público
  { path: 'registro', component: Registro }, // Registro público
  {
    path: 'perfil',
    component: Perfil,
    canActivate: [authGuard] // Protegido - requiere autenticación
  },
  {
    path: 'mis-reservas',
    component: MisReservas,
    canActivate: [authGuard] // Protegido - requiere autenticación
  },
  // Aquí irán las rutas de reserva protegidas
  // { path: 'reservar/:deporte', component: ReservarDeporte, canActivate: [authGuard] },
  { path: '**', redirectTo: '' } // Cualquier ruta no encontrada va a bienvenida
];
