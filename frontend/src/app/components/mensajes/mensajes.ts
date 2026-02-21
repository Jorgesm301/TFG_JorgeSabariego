import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MessageService, IConversation } from '../../services/message.service';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.css'
})
export class Mensajes implements OnInit {
  conversaciones: IConversation[] = [];
  cargando = false;
  error = '';

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

  volverInicio(): void {
    this.router.navigate(['/']);
  }

  getTotalNoLeidos(): number {
    return this.conversaciones.reduce((sum, conv) => sum + conv.no_leidos, 0);
  }

  esMiMensaje(senderId: number): boolean {
    return senderId === this.authService.getUserData()?.id;
  }
}
