import { Component } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';

const CHAVE = 'vinho-maior-18';

@Component({
  selector: 'app-idade-gate',
  standalone: true,
  imports: [LogoComponent],
  templateUrl: './idade-gate.component.html',
  styleUrl: './idade-gate.component.scss'
})
export class IdadeGateComponent {
  liberado = this.jaConfirmou();
  menorDeIdade = false;

  confirmar(): void {
    this.liberado = true;
    try {
      localStorage.setItem(CHAVE, '1');
    } catch {
      // sem armazenamento: a pergunta volta no próximo acesso
    }
  }

  recusar(): void {
    this.menorDeIdade = true;
  }

  voltar(): void {
    this.menorDeIdade = false;
  }

  private jaConfirmou(): boolean {
    try {
      return localStorage.getItem(CHAVE) === '1';
    } catch {
      return false;
    }
  }
}
