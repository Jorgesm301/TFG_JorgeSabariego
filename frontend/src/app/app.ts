import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Registro } from './components/registro/registro'; // Importamos tu componente

@Component({
  selector: 'app-root',
  standalone: true, // Asegúrate de que tenga esto
  imports: [RouterOutlet, Registro], // <--- Añadimos "Registro" aquí
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('f');
}
