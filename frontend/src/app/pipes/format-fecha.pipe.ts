import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatFecha',
  standalone: true
})
export class FormatFechaPipe implements PipeTransform {
  transform(fecha: string | null | undefined, formato: 'corta' | 'larga' | 'iso' = 'larga'): string {
    if (!fecha) return '';

    try {
      // Extraer solo la parte de fecha si es ISO completo (2026-03-22T00:00:00.000000Z)
      const fechaParte = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const date = new Date(fechaParte + 'T00:00:00');

      switch (formato) {
        case 'corta':
          // Formato: 22 mar 2026
          return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

        case 'iso':
          // Formato original: 2026-03-22
          return fechaParte;

        case 'larga':
        default:
          // Formato: 22 de marzo de 2026
          return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
      }
    } catch (e) {
      return fecha;
    }
  }
}
