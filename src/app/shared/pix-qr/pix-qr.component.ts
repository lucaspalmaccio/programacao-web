import { Component, Input, OnChanges } from '@angular/core';

const TAMANHO = 25;

interface Modulo {
  x: number;
  y: number;
}

/** Gerador pseudoaleatório determinístico: o mesmo pedido gera sempre o mesmo desenho. */
function gerador(semente: string): () => number {
  let h = 1779033703 ^ semente.length;
  for (let i = 0; i < semente.length; i++) {
    h = Math.imul(h ^ semente.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * QR Code ILUSTRATIVO, só para a simulação de Pix: tem os três quadrados de
 * posição e módulos pseudoaleatórios, mas não codifica nenhum pagamento.
 */
@Component({
  selector: 'app-pix-qr',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.viewBox]="'-2 -2 ' + (tamanho + 4) + ' ' + (tamanho + 4)"
      role="img"
      aria-label="QR Code ilustrativo do Pix (simulação)"
      shape-rendering="crispEdges"
    >
      <rect x="-2" y="-2" [attr.width]="tamanho + 4" [attr.height]="tamanho + 4" fill="#fff" />
      @for (m of modulos; track m.x + '-' + m.y) {
        <rect [attr.x]="m.x" [attr.y]="m.y" width="1" height="1" class="modulo" />
      }
      @for (p of posicoes; track p.x + '-' + p.y) {
        <rect [attr.x]="p.x" [attr.y]="p.y" width="7" height="7" class="modulo" />
        <rect [attr.x]="p.x + 1" [attr.y]="p.y + 1" width="5" height="5" fill="#fff" />
        <rect [attr.x]="p.x + 2" [attr.y]="p.y + 2" width="3" height="3" class="modulo" />
      }
      <!-- selo central com a taça -->
      <rect x="9.5" y="9.5" width="6" height="6" rx="1" fill="#fff" />
      <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.35">
        <ellipse cx="12.5" cy="10.5" rx="1.6" ry="0.4" stroke="#c9a24b" />
        <path d="M11.2 11.6 C11.2 13.4 11.8 14 12.5 14 C13.2 14 13.8 13.4 13.8 11.6 M12.5 14 V14.9 M11.7 14.9 H13.3" stroke="#5c1a2e" />
      </g>
    </svg>
  `,
  styles: [`
    :host { display: inline-block; }
    svg { display: block; width: 100%; height: auto; }
    .modulo { fill: var(--vinho-bordo-escuro); }
  `]
})
export class PixQrComponent implements OnChanges {
  @Input() semente = 'divino';

  readonly tamanho = TAMANHO;
  readonly posicoes: Modulo[] = [
    { x: 0, y: 0 },
    { x: TAMANHO - 7, y: 0 },
    { x: 0, y: TAMANHO - 7 }
  ];
  modulos: Modulo[] = [];

  ngOnChanges(): void {
    const sorteio = gerador(this.semente);
    const lista: Modulo[] = [];
    for (let y = 0; y < TAMANHO; y++) {
      for (let x = 0; x < TAMANHO; x++) {
        if (this.reservado(x, y)) {
          continue;
        }
        // linhas de alinhamento (pontilhado) e o restante aleatório
        const alinhamento = (x === 6 || y === 6) && (x + y) % 2 === 0;
        if (alinhamento || (x !== 6 && y !== 6 && sorteio() > 0.52)) {
          lista.push({ x, y });
        }
      }
    }
    this.modulos = lista;
  }

  private reservado(x: number, y: number): boolean {
    const nosCantos =
      (x < 8 && y < 8) ||
      (x >= TAMANHO - 8 && y < 8) ||
      (x < 8 && y >= TAMANHO - 8);
    const nocentro = x >= 9 && x <= 15 && y >= 9 && y <= 15;
    return nosCantos || nocentro;
  }
}
