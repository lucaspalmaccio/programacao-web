import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  mensagem = signal<string | null>(null);
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  mostrar(texto: string): void {
    this.mensagem.set(texto);
    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }
    this.temporizador = setTimeout(() => this.mensagem.set(null), 2500);
  }
}
