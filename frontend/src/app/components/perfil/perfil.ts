import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
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
import { MatDialog } from '@angular/material/dialog';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';
import { SharedMessagesDrawerComponent } from '../shared/shared-messages-drawer/shared-messages-drawer';
import { ConfigurarPerfilComponent } from '../configurar-perfil/configurar-perfil';

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
    SharedMessagesDrawerComponent,
    ConfigurarPerfilComponent
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit, OnDestroy {
  usuario: any = null;
  deportesElo: any[] = [];
  cargandoElo = false;
  deportesMenu = DEPORTES_MENU;

  cargandoPartidos = false;
  victorias = 0;
  totalPartidosJugados = 0;
  tasaVictoria = 0;
  rachaVictorias = 0;
  historialPartidos: any[] = [];

  editProfileVisible = false;
  @ViewChild(ConfigurarPerfilComponent) editProfileDialog!: ConfigurarPerfilComponent;

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
    for (const partido of partidos) {
      if (partido.gane) {
        racha++;
      } else {
        break;
      }
    }
    return racha;
  }

  private getNivelPorElo(elo: number): string {
    if (elo < 50) return 'Principiante';
    if (elo < 100) return 'Amateur';
    if (elo < 200) return 'Intermedio';
    if (elo < 300) return 'Avanzado';
    return 'Profesional';
  }

  private getIconoPorElo(elo: number): string {
    if (elo < 50) return 'school';
    if (elo < 100) return 'star_half';
    if (elo < 200) return 'star';
    if (elo < 300) return 'military_tech';
    return 'emoji_events';
  }

  get nivelIcon(): string {
    return this.getIconoPorElo(this.eloPromedio);
  }

  get nivel(): string {
    return this.getNivelPorElo(this.eloPromedio);
  }

  get drawerAbierto$() {
    return this.drawerMessagesService.drawerAbierto$;
  }

  get modoNuevoMensaje$() {
    return this.drawerMessagesService.modoNuevoMensaje$;
  }

  get cargandoConversaciones$() {
    return this.drawerMessagesService.cargandoConversaciones$;
  }

  get conversaciones$() {
    return this.drawerMessagesService.conversaciones$;
  }

  get cargandoAmigos$() {
    return this.drawerMessagesService.cargandoAmigos$;
  }

  get amigos$() {
    return this.drawerMessagesService.amigos$;
  }

  get totalNoLeidos$() {
    return this.conversaciones$.pipe(
      map(convs => convs.reduce((sum, conv) => sum + conv.no_leidos, 0))
    );
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

  abrirEditarPerfil(): void {
    this.editProfileVisible = true;
    if (this.editProfileDialog) {
      this.editProfileDialog.data = {
        name: this.usuario.name,
        last_name: this.usuario.last_name,
        email: this.usuario.email
      };
      this.editProfileDialog.visible = true;
      this.cdr.detectChanges();
    }
  }

  onEditProfileSave(result: any): void {
    if (result) {
      this.usuario = result;
      this.editProfileVisible = false;
      this.cdr.detectChanges();
    }
  }

  onEditProfileCancel(): void {
    this.editProfileVisible = false;
    this.cdr.detectChanges();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navegarADeporte(ruta: string): void {
    this.router.navigate([ruta]);
  }
}

