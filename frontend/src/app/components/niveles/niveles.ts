import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { EloService } from '../../services/elo.service';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { DEPORTES_MENU } from '../../constants/sports.constants';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';
import { SharedMessagesDrawerComponent } from '../shared/shared-messages-drawer/shared-messages-drawer';

interface INivel {
  nombre: string;
  rango: string;
  icon: string;
  minElo: number;
  maxElo: number;
}

@Component({
  selector: 'app-niveles',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedPageHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    SharedMessagesDrawerComponent
  ],
  templateUrl: './niveles.html',
  styleUrl: './niveles.css'
})
export class Niveles implements OnInit, OnDestroy {
  usuario: any = null;
  eloPromedio = 0;
  deportesMenu = DEPORTES_MENU;

  // Mensajería
  drawerAbierto = false;
  conversaciones: IConversation[] = [];
  cargandoConversaciones = false;
  private intervaloMensajes: any;

  // Nuevo mensaje
  modoNuevoMensaje = false;
  amigos: IUser[] = [];
  cargandoAmigos = false;

  niveles: INivel[] = [
    {
      nombre: 'Profesional',
      rango: '≥ 300',
      icon: 'emoji_events',
      minElo: 300,
      maxElo: 9999
    },
    {
      nombre: 'Avanzado',
      rango: '200 - 300',
      icon: 'military_tech',
      minElo: 200,
      maxElo: 299
    },
    {
      nombre: 'Intermedio',
      rango: '100 - 200',
      icon: 'star',
      minElo: 100,
      maxElo: 199
    },
    {
      nombre: 'Amateur',
      rango: '50-100',
      icon: 'star_half',
      minElo: 50,
      maxElo: 99
    },
    {
      nombre: 'Principiante',
      rango: '< 50',
      icon: 'school',
      minElo: 0,
      maxElo: 49
    }
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
    this.eloService.getMyElo().subscribe({
      next: (data) => {
        const deportesElo = data.sports || [];
        this.eloPromedio = deportesElo.length > 0
          ? Math.round(deportesElo.reduce((sum: number, sport: any) => sum + sport.elo, 0) / deportesElo.length)
          : 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar ELO:', err);
      }
    });
  }

  getNivelActual(nivel: INivel): boolean {
    return this.eloPromedio >= nivel.minElo && this.eloPromedio <= nivel.maxElo;
  }

  get estaLogueado(): boolean {
    return this.authService.isAuthenticated();
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
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

  navegarADeporte(ruta: string): void {
    this.router.navigate([ruta]);
  }
}
