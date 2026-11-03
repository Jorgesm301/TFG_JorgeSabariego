import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatFecha',
  standalone: true
})
export class FormatFechaPipe implements PipeTransform {
  transform(fecha: string | null | undefined, formato: 'corta' | 'larga' | 'iso' = 'larga'): string {
    if (!fecha) return '';

    try {
      const fechaParte = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const date = new Date(fechaParte + 'T00:00:00');

      switch (formato) {
        case 'corta':
          return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

        case 'iso':
          return fechaParte;

        case 'larga':
        default:
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
