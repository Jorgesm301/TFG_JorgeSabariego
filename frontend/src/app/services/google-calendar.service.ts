import { Injectable } from '@angular/core';
import { IBooking } from './booking';

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {

  constructor() { }

  abrirEnGoogleCalendar(reserva: IBooking): void {
    const evento = this.construirEvento(reserva);
    const url = `https://calendar.google.com/calendar/u/0/r/eventedit?${evento}`;
    window.open(url, '_blank');
  }

  private construirEvento(reserva: IBooking): string {

    const inicio = this.formatearFechaGoogleCalendar(reserva.fecha, reserva.hora_inicio);
    const fin = this.formatearFechaGoogleCalendar(reserva.fecha, reserva.hora_fin);

    const titulo = `${reserva.sport?.nombre || 'Partido'} en ${reserva.pista}`;

    const descripcion = `
Partido de ${reserva.sport?.nombre || 'Deporte'}
Jugadores: ${reserva.jugadores_actuales}/${reserva.max_jugadores}
Pista: ${reserva.pista}
Estado: ${reserva.estado}
    `.trim();


    const zonaHoraria = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const params = new URLSearchParams({
      text: titulo,
      dates: `${inicio}/${fin}`,
      details: descripcion,
      location: reserva.pista || '',
      ctz: zonaHoraria
    });

    return params.toString();
  }

  private formatearFechaGoogleCalendar(fecha: string, hora: string): string {

    const fechaLimpia = fecha.split('T')[0];
    const fechaDividida = fechaLimpia.split('-');
    const horaDividida = hora.split(':');

    const anio = fechaDividida[0];
    const mes = fechaDividida[1];
    const dia = fechaDividida[2];
    const h = horaDividida[0];
    const m = horaDividida[1];
    const s = horaDividida[2] || '00';

    return `${anio}${mes}${dia}T${h}${m}${s}`;
  }
}
