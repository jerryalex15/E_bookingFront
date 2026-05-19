import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'utcToLocal',
  standalone: true
})
export class UtcToLocalPipe implements PipeTransform {

  transform(heureUtc: string, dateStr: string[]): string {
    if (!heureUtc || !dateStr) return '';

    const dateCompleteUTC = new Date(`${dateStr}T${heureUtc.substring(0, 5)}:00Z`); // date ISO complète avec le suffixe 'Z' pour l'UTC

    return dateCompleteUTC.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

}
