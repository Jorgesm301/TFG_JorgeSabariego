import { Routes } from '@angular/router';
import { Registro } from './components/registro/registro';
import { Login } from './components/login/login';
import { Bienvenida } from './components/bienvenida/bienvenida';
import { Perfil } from './components/perfil/perfil';
import { MisReservas } from './components/mis-reservas/mis-reservas';
import { Reservar } from './components/reservar/reservar';
import { Ero } from './components/ero/ero';
import { PartidoDetalle } from './components/partido-detalle/partido-detalle';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  //Pagina principal, login y registro, endpoints publicos.
  { path: '', component: Bienvenida },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },

  {
    path: 'perfil',
    component: Perfil,
    canActivate: [authGuard]
  },

  {
    path: 'mis-reservas',
    component: MisReservas,
    canActivate: [authGuard]
  },

  {
    path: 'reservar/:deporte',
    component: Reservar
  },
  {
    path: 'ero',
    component: Ero,
    canActivate: [authGuard]
  },

  {
    path: 'partido/:id',
    component: PartidoDetalle,
    canActivate: [authGuard]
  },

  // Cualquier ruta no encontrada va a la pagina de bienvenida
  { path: '**', redirectTo: '' }
];
