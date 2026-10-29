import { Component, DOCUMENT, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './services/toast';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly toastSvc = inject(Toast);
  protected readonly christmas = environment.christmasTheme;

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

  constructor() {
    // La classe sur <body> active les surcharges de styles.css
    if (this.christmas) {
      inject(DOCUMENT).body.classList.add('christmas');
    }
  }
}
