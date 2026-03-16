import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { EloService } from '../../services/elo.service';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';
import { SharedMessagesDrawerComponent } from '../shared/shared-messages-drawer/shared-messages-drawer';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedPageHeaderComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SharedMessagesDrawerComponent
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit, OnDestroy {
  usuario: any = null;
  deportesElo: any[] = [];
  cargandoElo = false;
  totalPartidos = 0;
  drawerAbierto = false;
  conversaciones: IConversation[] = [];
  cargandoConversaciones = false;
  modoNuevoMensaje = false;
  amigosDrawer: IUser[] = [];
  cargandoAmigosDrawer = false;
  private intervaloMensajes: any;
  deportesMenu = [
    { nombre: 'Futbol', icon: 'sports_soccer', ruta: '/reservar/futbol' },
    { nombre: 'Futbol Sala', icon: 'sports_soccer', ruta: '/reservar/futbol-sala' },
    { nombre: 'Baloncesto', icon: 'sports_basketball', ruta: '/reservar/baloncesto' },
    { nombre: 'Tenis', icon: 'sports_tennis', ruta: '/reservar/tenis' },
    { nombre: 'Padel', icon: 'sports_tennis', ruta: '/reservar/padel' },
    { nombre: 'Voleibol', icon: 'sports_volleyball', ruta: '/reservar/voleibol' },
    { nombre: 'Natacion', icon: 'pool', ruta: '/reservar/natacion' },
    { nombre: 'Atletismo', icon: 'directions_run', ruta: '/reservar/atletismo' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private eloService: EloService,
    private messageService: MessageService,
    private friendshipService: FriendshipService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

    //Si no esta registrado el usuario, redirigimos al login
    if (!this.usuario) {
      this.router.navigate(['/login']);
    } else {
      this.cargarElo();
      this.cargarConversaciones();
      this.iniciarActualizacionMensajes();
    }
  }

  ngOnDestroy(): void {
    if (this.intervaloMensajes) {
      clearInterval(this.intervaloMensajes);
    }
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
  }

  cargarElo(): void {
    this.cargandoElo = true;
    this.eloService.getMyElo().subscribe({
      next: (data) => {
        this.deportesElo = data.sports;
        this.totalPartidos = data.sports.reduce((sum: number, sport: any) => sum + sport.matches_played, 0);
        this.cargandoElo = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ELO:', err);
        this.cargandoElo = false;
      }
    });
  }

  cargarConversaciones(): void {
    this.cargandoConversaciones = true;
    this.messageService.listarConversaciones().subscribe({
      next: (data) => {
        this.conversaciones = data;
        this.cargandoConversaciones = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar conversaciones:', err);
        this.cargandoConversaciones = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarActualizacionMensajes(): void {
    this.intervaloMensajes = setInterval(() => {
      this.cargarConversaciones();
    }, 30000);
  }

  getTotalNoLeidos(): number {
    return this.conversaciones.reduce((sum, conv) => sum + conv.no_leidos, 0);
  }

  toggleDrawer(): void {
    this.drawerAbierto = !this.drawerAbierto;
    if (this.drawerAbierto) {
      this.cargarConversaciones();
    }
  }

  cerrarDrawer(): void {
    this.drawerAbierto = false;
    this.modoNuevoMensaje = false;
  }

  abrirNuevoMensaje(): void {
    this.modoNuevoMensaje = true;
    this.cargarAmigosDrawer();
  }

  volverAConversaciones(): void {
    this.modoNuevoMensaje = false;
  }

  cargarAmigosDrawer(): void {
    this.cargandoAmigosDrawer = true;
    this.friendshipService.listarAmigos().subscribe({
      next: (data) => {
        this.amigosDrawer = data;
        this.cargandoAmigosDrawer = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar amigos:', err);
        this.cargandoAmigosDrawer = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirChat(amigoId: number): void {
    this.cerrarDrawer();
    this.router.navigate(['/chat', amigoId]);
  }

  irAMensajes(): void {
    this.cerrarDrawer();
    this.router.navigate(['/mensajes']);
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  volverInicio() {
    this.router.navigate(['/']);
  }

  navegarADeporte(ruta: string): void {
    this.router.navigate([ruta]);
  }
}

