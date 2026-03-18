import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { EloService } from '../../services/elo.service';
import { MatchService } from '../../services/match.service';
import { DrawerMessagesService } from '../../services/drawer-messages.service';
import { DEPORTES_MENU } from '../../constants/sports.constants';
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
  deportesMenu = DEPORTES_MENU;

  // Victorias
  cargandoPartidos = false;
  victorias = 0;
  totalPartidosJugados = 0;
  tasaVictoria = 0;
  rachaVictorias = 0;
  nivel = '';
  historialPartidos: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private eloService: EloService,
    private matchService: MatchService,
    private drawerMessagesService: DrawerMessagesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUserData();

    //Si no esta registrado el usuario, redirigimos al login
    if (!this.usuario) {
      this.router.navigate(['/login']);
    } else {
      this.cargarElo();
      this.cargarPartidos();
      this.drawerMessagesService.cargarConversaciones();
      this.drawerMessagesService.iniciarActualizacionMensajes();
    }
  }

  ngOnDestroy(): void {
    this.drawerMessagesService.detenerActualizacionMensajes();
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
  }

  get eloPromedio(): number {
    if (!this.deportesElo.length) return 0;
    const total = this.deportesElo.reduce((acum, deporte) => acum + deporte.elo, 0);
    return Math.round(total / this.deportesElo.length);
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

  cargarPartidos(): void {
    this.cargandoPartidos = true;
    this.matchService.getHistorialPartidos().subscribe({
      next: (datos) => {
        this.historialPartidos = datos;
        this.totalPartidosJugados = datos.length;
        this.victorias = datos.filter(p => p.gane).length;
        this.tasaVictoria = this.totalPartidosJugados > 0
          ? Math.round((this.victorias / this.totalPartidosJugados) * 100)
          : 0;
        this.rachaVictorias = this.calcularRachaVictorias(datos);
        this.nivel = this.getNivelPorElo(this.eloPromedio);
        this.cargandoPartidos = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar partidos:', err);
        this.cargandoPartidos = false;
      }
    });
  }

  private calcularRachaVictorias(partidos: any[]): number {
    let racha = 0;
    // Los partidos vienen más recientes primero, así que iteramos desde el inicio
    for (const partido of partidos) {
      if (partido.gane) {
        racha++;
      } else {
        break; // Rompe la racha en el primer partido perdido
      }
    }
    return racha;
  }

  private getNivelPorElo(elo: number): string {
    if (elo < 900) return 'Principiante';
    if (elo < 1200) return 'Intermedio';
    if (elo < 1500) return 'Profesional';
    return 'Top';
  }

  get drawerAbierto(): boolean {
    return this.drawerMessagesService.drawerAbierto$.value;
  }

  get modoNuevoMensaje(): boolean {
    return this.drawerMessagesService.modoNuevoMensaje$.value;
  }

  get cargandoConversaciones(): boolean {
    return this.drawerMessagesService.cargandoConversaciones$.value;
  }

  get conversaciones() {
    return this.drawerMessagesService.conversaciones$.value;
  }

  get cargandoAmigosDrawer(): boolean {
    return this.drawerMessagesService.cargandoAmigos$.value;
  }

  get amigosDrawer() {
    return this.drawerMessagesService.amigos$.value;
  }

  getTotalNoLeidos(): number {
    return this.conversaciones.reduce((sum, conv) => sum + conv.no_leidos, 0);
  }

  toggleDrawer(): void {
    this.drawerMessagesService.toggleDrawer();
  }

  cerrarDrawer(): void {
    this.drawerMessagesService.cerrarDrawer();
  }

  abrirNuevoMensaje(): void {
    this.drawerMessagesService.abrirNuevoMensaje();
  }

  volverAConversaciones(): void {
    this.drawerMessagesService.volverAConversaciones();
  }

  abrirChat(amigoId: number): void {
    this.drawerMessagesService.abrirChat(amigoId);
  }

  irAMensajes(): void {
    this.drawerMessagesService.irAMensajes();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navegarADeporte(ruta: string): void {
    this.router.navigate([ruta]);
  }
}

