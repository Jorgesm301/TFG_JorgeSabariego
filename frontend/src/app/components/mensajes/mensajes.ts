import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MessageService, IConversation } from '../../services/message.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatBadgeModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css'
})
export class Mensajes implements OnInit {
  conversaciones: IConversation[] = [];
  cargando = false;
  error = '';
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
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.getUserData();
    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarConversaciones();
  }

  cargarConversaciones(): void {
    this.cargando = true;
    this.error = '';
    this.messageService.listarConversaciones().subscribe({
      next: (data) => {
        this.conversaciones = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar conversaciones:', err);
        this.error = 'No se pudieron cargar las conversaciones';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirChat(amigo: any): void {
    this.router.navigate(['/chat', amigo.id]);
  }

  navegarADeporte(ruta: string): void {
    this.router.navigate([ruta]);
  }

  getTotalNoLeidos(): number {
    return this.conversaciones.reduce((sum, conv) => sum + conv.no_leidos, 0);
  }

  get nombreUsuario(): string {
    return this.authService.getUserData()?.name || '';
  }

  esMiMensaje(senderId: number): boolean {
    return senderId === this.authService.getUserData()?.id;
  }
}
