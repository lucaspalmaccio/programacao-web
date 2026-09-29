import { Injectable } from '@angular/core';
import { Endereco } from './auth.service';
import { gravarJson, lerJson } from './armazenamento';

export interface ItemPedido {
  produtoId: number;
  nome: string;
  foto: string;
  preco: number;
  quantidade: number;
}

export interface Pedido {
  id: number;
  data: string;
  emailUsuario: string;
  itens: ItemPedido[];
  subtotal: number;
  frete: number;
  total: number;
  endereco: Endereco;
  pagamento: string;
  status: string;
}

const CHAVE = 'vinho-pedidos';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  criar(dados: Omit<Pedido, 'id' | 'data' | 'status'>, status = 'Pedido recebido'): Pedido {
    const todos = this.todos();
    const ultimo = todos.reduce((maior, p) => Math.max(maior, p.id), 1000);
    const pedido: Pedido = {
      ...dados,
      id: ultimo + 1,
      data: new Date().toISOString(),
      status
    };
    gravarJson(CHAVE, [...todos, pedido]);
    return pedido;
  }

  atualizarStatus(id: number, status: string): void {
    gravarJson(CHAVE, this.todos().map(p => (p.id === id ? { ...p, status } : p)));
  }

  doUsuario(email: string): Pedido[] {
    return this.todos()
      .filter(p => p.emailUsuario === email)
      .sort((a, b) => b.id - a.id);
  }

  private todos(): Pedido[] {
    const lista = lerJson<Pedido[]>(CHAVE, []);
    return Array.isArray(lista) ? lista : [];
  }
}
