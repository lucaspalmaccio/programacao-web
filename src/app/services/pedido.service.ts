import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Endereco } from './auth.service';
import { API_URL } from './api';
import { aplicarMascara } from '../shared/mascara.directive';

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
  clienteId: number;
  itens: ItemPedido[];
  subtotal: number;
  frete: number;
  total: number;
  endereco: Endereco;
  pagamento: string;
  status: string;
}

/** Pedidos gravados no banco pela API; subtotal e total são calculados pelo servidor. */
@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private readonly url = `${API_URL}/pedidos`;

  constructor(private http: HttpClient) {}

  async criar(dados: Pick<Pedido, 'clienteId' | 'itens' | 'frete' | 'endereco' | 'pagamento'>, status = 'Pedido recebido'): Promise<Pedido> {
    return this.formatar(await firstValueFrom(this.http.post<Pedido>(this.url, { ...dados, status })));
  }

  async atualizarStatus(id: number, status: string): Promise<Pedido> {
    return this.formatar(await firstValueFrom(this.http.put<Pedido>(`${this.url}/${id}/status`, { status })));
  }

  async doCliente(clienteId: number): Promise<Pedido[]> {
    const lista = await firstValueFrom(this.http.get<Pedido[]>(this.url, { params: { clienteId } }));
    return lista.map(p => this.formatar(p));
  }

  /** A API guarda o CEP só com dígitos; na tela ele aparece com máscara. */
  private formatar(pedido: Pedido): Pedido {
    return { ...pedido, endereco: { ...pedido.endereco, cep: aplicarMascara(pedido.endereco.cep, 'cep') } };
  }
}
