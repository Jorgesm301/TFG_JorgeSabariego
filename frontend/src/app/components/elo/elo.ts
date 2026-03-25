import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { EloService } from '../../services/elo.service';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';
import { SharedMessagesDrawerComponent } from '../shared/shared-messages-drawer/shared-messages-drawer';

interface ISportElo {
  sport_name: string;
  matches_played: number;
  elo: number;
}

@Component({
  selector: 'app-elo',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedPageHeaderComponent,
    MatCardModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    SharedMessagesDrawerComponent
  ],
  templateUrl: './elo.html',
  styleUrl: './elo.css',
})
export class Elo implements OnInit {
  deportesElo: ISportElo[] = [];
  cargandoElo = false;
  usuario: any = null;

  drawerAbierto = false;
  conversaciones: IConversation[] = [];
  cargandoConversaciones = false;
  private intervaloMensajes: any;

  modoNuevoMensaje = false;
  amigos: IUser[] = [];
  cargandoAmigos = false;

  deportesMenu = [
    { nombre: 'Fútbol', icon: 'sports_soccer', ruta: '/reservar/futbol' },
    { nombre: 'Fútbol Sala', icon: 'sports_soccer', ruta: '/reservar/futbol-sala' },
    { nombre: 'Baloncesto', icon: 'sports_basketball', ruta: '/reservar/baloncesto' },
    { nombre: 'Tenis', icon: 'sports_tennis', ruta: '/reservar/tenis' },
    { nombre: 'Pádel', icon: 'sports_tennis', ruta: '/reservar/padel' },
    { nombre: 'Voleibol', icon: 'sports_volleyball', ruta: '/reservar/voleibol' },
    { nombre: 'Natación', icon: 'pool', ruta: '/reservar/natacion' },
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

  cargarElo(): void {
    this.cargandoElo = true;
    this.eloService.getMyElo().subscribe({
      next: (data) => {
        const sports = Array.isArray(data?.sports) ? data.sports : [];
        this.deportesElo = sports.sort((a: ISportElo, b: ISportElo) => b.elo - a.elo);
        this.cargandoElo = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ELO:', err);
        this.cargandoElo = false;
      }
    });
  }

  get estaLogueado(): boolean {
    return this.authService.isAuthenticated();
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
  }

  navegarADeporte(ruta: string) {
    this.router.navigate([ruta]);
  }

  cargarConversaciones(): void {
    if (!this.estaLogueado) return;

    this.cargandoConversaciones = true;
    this.messageService.listarConversaciones().subscribe({
      next: (data) => {
        this.conversaciones = data;
        this.cargandoConversaciones = false;
        this.cdr.detectChanges();
      },
      error: () => {
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
    this.cargarAmigos();
  }

  volverAConversaciones(): void {
    this.modoNuevoMensaje = false;
  }

  cargarAmigos(): void {
    this.cargandoAmigos = true;
    this.friendshipService.listarAmigos().subscribe({
      next: (data) => {
        this.amigos = data;
        this.cargandoAmigos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoAmigos = false;
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

  get totalPartidos(): number {
    return this.deportesElo.reduce((acum, deporte) => acum + deporte.matches_played, 0);
  }

  get eloPromedio(): number {
    if (!this.deportesElo.length) return 0;
    const total = this.deportesElo.reduce((acum, deporte) => acum + deporte.elo, 0);
    return Math.round(total / this.deportesElo.length);
  }

  get mejorDeporte(): ISportElo | null {
    return this.deportesElo.length ? this.deportesElo[0] : null;
  }

  getNivelPorElo(elo: number): string {
    if (elo < 900) return 'Inicial';
    if (elo < 1100) return 'Principiante';
    if (elo < 1300) return 'Intermedio';
    if (elo < 1500) return 'Avanzado';
    return 'Competitivo';
  }

  getColorNivel(elo: number): 'primary' | 'accent' | 'warn' {
    if (elo >= 260) return 'primary';
    if (elo >= 170) return 'accent';
    return 'warn';
  }

  getIconoDeporte(nombreDeporte: string): string {
    const nombre = nombreDeporte.toLowerCase();

    if (nombre.includes('futbol')) return 'sports_soccer';
    if (nombre.includes('baloncesto')) return 'sports_basketball';
    if (nombre.includes('tenis') || nombre.includes('padel')) return 'sports_tennis';
    if (nombre.includes('voleibol')) return 'sports_volleyball';
    if (nombre.includes('natacion')) return 'pool';
    if (nombre.includes('atletismo')) return 'directions_run';

    return 'emoji_events';
  }

  getRutaReserva(nombreDeporte: string): string | null {
    const nombre = nombreDeporte.toLowerCase();

    if (nombre.includes('futbol')) {
      return nombre.includes('sala') ? '/reservar/futbol-sala' : '/reservar/futbol';
    }
    if (nombre.includes('baloncesto') || nombre.includes('basketball')) return '/reservar/baloncesto';
    if (nombre.includes('tenis')) return '/reservar/tenis';
    if (nombre.includes('padel') || nombre.includes('pádel')) return '/reservar/padel';
    if (nombre.includes('voleibol') || nombre.includes('volleyball')) return '/reservar/voleibol';
    if (nombre.includes('natacion') || nombre.includes('natación') || nombre.includes('swimming')) return '/reservar/natacion';
    if (nombre.includes('atletismo') || nombre.includes('athletics') || nombre.includes('running')) return '/reservar/atletismo';

    return null;
  }
}

