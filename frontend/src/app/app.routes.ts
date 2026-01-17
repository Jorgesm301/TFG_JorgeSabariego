import { Routes } from '@angular/router';
import { Registro } from './components/registro/registro';
import { Login } from './components/login/login';
import { Bienvenida } from './components/bienvenida/bienvenida';

export const routes: Routes = [
  { path: '', component: Bienvenida }, // Página de inicio
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: '**', redirectTo: '' } // Cualquier ruta no encontrada va a bienvenida
];
