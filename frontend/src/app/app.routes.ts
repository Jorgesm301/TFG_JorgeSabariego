import { Routes } from '@angular/router';
import { Registro } from './components/registro/registro';
import { Login } from './components/login/login';
import { Bienvenida } from './components/bienvenida/bienvenida';
import { PaginaPrincipal } from './components/pagina-principal/pagina-principal';

export const routes: Routes = [
  { path: '', component: Bienvenida }, // Página de inicio
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'principal', component: PaginaPrincipal }, // Página principal después de login
  { path: '**', redirectTo: '' } // Cualquier ruta no encontrada va a bienvenida
];
