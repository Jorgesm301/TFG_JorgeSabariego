import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookingService, IBooking } from '../../services/booking';
import { MatchService, IEquiposResponse, ICambioElo } from '../../services/match.service';
import { AuthService } from '../../services/auth';
import { MessageService, IConversation } from '../../services/message.service';
import { FriendshipService, IUser } from '../../services/friendship.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { SharedPageHeaderComponent } from '../shared/shared-page-header/shared-page-header';
import { SharedMessagesDrawerComponent } from '../shared/shared-messages-drawer/shared-messages-drawer';

@Component({
  selector: 'app-partido-detalle',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    SharedPageHeaderComponent, MatButtonModule, MatIconModule, MatCardModule,
    MatListModule, MatDividerModule, MatProgressSpinnerModule,
    MatMenuModule, MatTooltipModule, MatBadgeModule,
    SharedMessagesDrawerComponent
  ],
  templateUrl: './partido-detalle.html',
  styleUrl: './partido-detalle.css'
})
export class PartidoDetalle implements OnInit {
  bookingId: number | null = null;
  booking: IBooking | null = null;
  equipos: IEquiposResponse | null = null;
  cargando = false;
  error = '';
  generandoEquipos = false;
  registrandoResultado = false;
  scoreEquipo1: number = 0;
  scoreEquipo2: number = 0;

  //Para actualizar el ELO despues del resultado
  cambiosElo: ICambioElo[] = [];
  resultadoRegistrado = false;

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
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private matchService: MatchService,
    private authService: AuthService,
    private messageService: MessageService,
    private friendshipService: FriendshipService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.bookingId = +params['id'];
      if (this.bookingId) {
        this.cargarDetalles();
      }
    });

    if (this.estaLogueado) {
      this.cargarConversaciones();
      this.iniciarActualizacionMensajes();
    }
  }

  ngOnDestroy(): void {
    if (this.intervaloMensajes) {
      clearInterval(this.intervaloMensajes);
    }
  }

  cargarDetalles(): void {
    if (!this.bookingId)
       return;

    this.cargando = true;
    this.error = '';

    this.bookingService.getMisReservas().subscribe({
      next: (reservas) => {
        this.booking = reservas.find(r => r.id === this.bookingId) || null;

        if (this.booking && this.booking.estado !== 'abierto') {
          //Si esta completo el partido, generamos los equipos
          this.cargarEquipos();
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar detalles:', error);
        this.error = 'Error al cargar los detalles del partido';
        this.cargando = false;
      }
    });
  }

  cargarEquipos(): void {
    if (!this.bookingId)
       return;

    this.matchService.obtenerEquipos(this.bookingId).subscribe({
      next: (equipos) => {
        this.equipos = equipos;
        this.cdr.detectChanges();
      },
      error: (error) => {
        //Error por si no hay equipos generados.
        if (error.status !== 400) {
          console.error('Error al cargar equipos:', error);
        }
      }
    });
  }

  generarEquipos(): void {
    if (!this.bookingId || this.generandoEquipos)
       return;

    if (!confirm('¿Generar equipos equilibrados para este partido?')) {
      return;
    }

    this.generandoEquipos = true;
    this.error = '';

    this.matchService.generarEquipos(this.bookingId).subscribe({
      next: (response) => {
        console.log('Equipos generados:', response);
        alert('Equipos generados exitosamente');
        this.cargarEquipos();
        this.generandoEquipos = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al generar equipos:', error);
        this.error = error.error?.message || 'Error al generar equipos';
        this.generandoEquipos = false;
        this.cdr.detectChanges();
      }
    });
  }

  registrarResultado(): void {
    if (!this.bookingId || this.registrandoResultado)
      return;

    if (this.scoreEquipo1 < 0 || this.scoreEquipo2 < 0) {
      alert('Los marcadores no pueden ser negativos');
      return;
    }

    if (!confirm(`¿Registrar resultado ${this.scoreEquipo1} - ${this.scoreEquipo2}?`)) {
      return;
    }

    this.registrandoResultado = true;
    this.error = '';

    this.matchService.registrarResultado(this.bookingId, this.scoreEquipo1, this.scoreEquipo2).subscribe({
      next: (response) => {
        console.log('Resultado registrado:', response);
        this.cambiosElo = response.cambios_elo;
        this.resultadoRegistrado = true;

        // Actualizamos el booking con los nuevos datos
        if (this.booking) {
          this.booking.team_1_score = response.resultado.team_1_score;
          this.booking.team_2_score = response.resultado.team_2_score;
          this.booking.winner_team = response.resultado.winner_team;
          this.booking.estado = 'jugado';
        }

        this.registrandoResultado = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al registrar resultado:', error);
        this.error = error.error?.message || 'Error al registrar resultado';
        this.registrandoResultado = false;
        this.cdr.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/mis-reservas']);
  }

  get estaLogueado(): boolean {
    return this.authService.isAuthenticated();
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  irAPerfil() {
    this.router.navigate(['/perfil']);
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

  get puedeGenerarEquipos(): boolean {
    return this.booking?.estado === 'completo' && !this.equipos;
  }

  get puedeRegistrarResultado(): boolean {
    return this.booking?.estado === 'completo' && !!this.equipos && !this.resultadoRegistrado;
  }

  get partidoJugado(): boolean {
    return this.booking?.estado === 'jugado';
  }

  calcularEloPromedio(equipo: any[]): number {
    if (!equipo || equipo.length === 0)
     return 1000;

    const suma = equipo.reduce((acc, j) => acc + (j.elo || 1000), 0);

    return Math.round(suma / equipo.length);
  }
}

