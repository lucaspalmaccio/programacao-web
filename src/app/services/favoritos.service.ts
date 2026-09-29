import { Injectable, signal } from '@angular/core';

const CHAVE = 'vinho-favoritos';

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {
  ids = signal<number[]>(this.carregar());

  ehFavorito(id: number): boolean {
    return this.ids().includes(id);
  }

  alternar(id: number): void {
    const atual = this.ids();
    this.ids.set(atual.includes(id) ? atual.filter(i => i !== id) : [...atual, id]);
    this.salvar();
  }

  private carregar(): number[] {
    try {
      const bruto = localStorage.getItem(CHAVE);
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista.filter(i => typeof i === 'number') : [];
    } catch {
      return [];
    }
  }

  private salvar(): void {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(this.ids()));
    } catch {
      // armazenamento indisponível: favoritos valem só nesta sessão
    }
  }
}
