import { Routes } from '@angular/router';
import { Registro } from './components/registro/registro';
import { Login } from './components/login/login';
import { Bienvenida } from './components/bienvenida/bienvenida';
import { Perfil } from './components/perfil/perfil';
import { MisReservas } from './components/mis-reservas/mis-reservas';
import { Reservar } from './components/reservar/reservar';
import { Elo } from './components/elo/elo';
import { Niveles } from './components/niveles/niveles';
import { PartidoDetalle } from './components/partido-detalle/partido-detalle';
import { Mensajes } from './components/mensajes/mensajes';
import { Chat } from './components/chat/chat';
import { Amigos } from './components/amigos/amigos';
import { authGuard } from './guards/auth.guard';
import { GoogleCallback } from './components/google-callback/google-callback';

export const routes: Routes = [

  { path: 'auth/google/callback', component: GoogleCallback },

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
    path: 'elo',
    component: Elo,
    canActivate: [authGuard]
  },

  {
    path: 'partido/:id',
    component: PartidoDetalle,
    canActivate: [authGuard]
  },

  {
    path: 'mensajes',
    component: Mensajes,
    canActivate: [authGuard]
  },

  {
    path: 'chat/:id',
    component: Chat,
    canActivate: [authGuard]
  },

  {
    path: 'amigos',
    component: Amigos,
    canActivate: [authGuard]
  },

  {
    path: 'niveles',
    component: Niveles,
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '' }

];
