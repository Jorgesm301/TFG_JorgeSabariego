import { Routes } from '@angular/router';
import { Registro } from './components/registro/registro';
import { Login } from './components/login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: '', redirectTo: '/login', pathMatch: 'full' } // Por defecto va al login
];
