import { Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './services/toast';
import { environment } from '../environments/environment';
import { resolveTheme } from './theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly toastSvc = inject(Toast);
  protected readonly theme = resolveTheme(environment.theme);

  // Flocons générés une seule fois : position, taille et vitesse aléatoires
  protected readonly snowflakes = Array.from({ length: 40 }, () => ({
    left: Math.random() * 100,
    size: 4 + Math.random() * 6,
    duration: 8 + Math.random() * 10,
    delay: -Math.random() * 18,
    opacity: 0.4 + Math.random() * 0.5,
  }));

  // Ampoules de la guirlande en haut de page
  protected readonly bulbs = Array.from({ length: 30 }, (_, i) => i);

  // Araignées suspendues en haut de page (position et longueur du fil)
  protected readonly spiders = [
    { left: 8, thread: 70, delay: 0 },
    { left: 31, thread: 40, delay: -1.2 },
    { left: 68, thread: 90, delay: -2.1 },
    { left: 91, thread: 55, delay: -0.6 },
  ];

  // Chauves-souris qui traversent l'écran
  protected readonly bats = Array.from({ length: 6 }, (_, i) => ({
    top: 8 + Math.random() * 60,
    size: 18 + Math.random() * 14,
    duration: 14 + Math.random() * 10,
    delay: -i * 4 - Math.random() * 4,
  }));

  constructor() {
    // La classe sur <body> active les surcharges de styles.css
    if (this.theme !== 'classic') {
      inject(DOCUMENT).body.classList.add(`theme-${this.theme}`);
    }
  }
}
