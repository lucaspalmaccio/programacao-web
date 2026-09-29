import { Component, Input } from '@angular/core';

/**
 * Logotipo "Di Vino": taça em line art com uma auréola dourada na borda,
 * seguida do nome em letra manuscrita (Great Vibes). Vetor puro, sem sombras e fundo transparente.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.viewBox]="mostrarTexto ? '0 0 212 64' : '0 0 52 64'"
      [attr.height]="altura"
      [style.width]="'auto'"
      role="img"
      aria-label="Di Vino"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <g transform="translate(3 2) scale(0.78)">
        <!-- auréola -->
        <ellipse cx="30" cy="8" rx="13" ry="3.2" class="dourado" stroke-width="1.8" />
        <!-- borda, corpo, haste e base da taça (um só traço contínuo) -->
        <ellipse cx="30" cy="20" rx="14" ry="3" class="bordo" stroke-width="2" />
        <path class="bordo" stroke-width="2"
          d="M16 20 C16 40 22 50 30 50 C38 50 44 40 44 20 M30 50 V70 M21 71 H39" />
        <!-- linha do vinho -->
        <path class="dourado" stroke-width="1.6" d="M19.5 33 C25 36 35 36 40.5 33" />
      </g>

      @if (mostrarTexto) {
        <text x="56" y="44" class="nome">Di Vino</text>
        <path class="dourado" stroke-width="1.4" d="M62 53 C90 57 140 57 196 50" />
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-block; line-height: 0; }
    svg { display: block; overflow: visible; }
    .bordo { stroke: var(--vinho-bordo); }
    .dourado { stroke: var(--vinho-dourado); }
    .nome {
      fill: var(--vinho-bordo);
      font-family: 'Great Vibes', 'Brush Script MT', cursive;
      font-size: 40px;
      font-weight: 400;
    }
  `]
})
export class LogoComponent {
  @Input() altura = 40;
  @Input() mostrarTexto = true;
}
