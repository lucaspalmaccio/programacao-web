import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Produto } from '../models/produto';
import { API_URL, mensagemDeErro } from './api';

export type NovoProduto = Omit<Produto, 'id'>;

export interface Resultado {
  ok: boolean;
  erro?: string;
}

/**
 * Catálogo vindo da API (backend/). A lista completa é carregada uma vez e fica em memória
 * (`produtos`); a busca e o detalhe consultam a API de novo.
 */
@Injectable({
  providedIn: 'root'
})
export class ProdutoService {

  private readonly url = `${API_URL}/produtos`;

  produtos = signal<Produto[]>([]);
  /** Mensagem do último erro ao carregar o catálogo (vazia quando deu certo). */
  erro = signal('');

  private carregamento: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  /** Carrega o catálogo na primeira chamada; se falhar, a próxima tenta de novo. */
  carregar(): Promise<void> {
    this.carregamento ??= firstValueFrom(this.http.get<Produto[]>(this.url))
      .then(lista => {
        this.produtos.set(lista);
        this.erro.set('');
      })
      .catch(e => {
        this.carregamento = null;
        this.erro.set(mensagemDeErro(e, 'Não foi possível carregar os vinhos.'));
      });
    return this.carregamento;
  }

  getProdutos(): Produto[] {
    return this.produtos();
  }

  getProdutoPorId(id: number): Produto | undefined {
    return this.produtos().find(p => p.id === id);
  }

  /** Dados editáveis de um vinho (tudo menos o id). */
  async criar(dados: NovoProduto): Promise<Resultado> {
    return this.gravar(async () => {
      const criado = await firstValueFrom(this.http.post<Produto>(this.url, dados));
      this.produtos.update(lista => [...lista, criado]);
    });
  }

  async atualizar(id: number, dados: NovoProduto): Promise<Resultado> {
    return this.gravar(async () => {
      const novo = await firstValueFrom(this.http.put<Produto>(`${this.url}/${id}`, dados));
      this.produtos.update(lista => lista.map(p => p.id === id ? novo : p));
    });
  }

  async excluir(id: number): Promise<Resultado> {
    return this.gravar(async () => {
      await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
      this.produtos.update(lista => lista.filter(p => p.id !== id));
    });
  }

  /** Envia a foto (multipart) e devolve a URL pública gerada pela API. */
  async enviarFoto(arquivo: File): Promise<Resultado & { url?: string }> {
    const corpo = new FormData();
    corpo.append('arquivo', arquivo);
    try {
      const { url } = await firstValueFrom(this.http.post<{ url: string }>(`${API_URL}/uploads/vinhos`, corpo));
      return { ok: true, url };
    } catch (e) {
      return { ok: false, erro: mensagemDeErro(e, 'Não foi possível enviar a imagem.') };
    }
  }

  private async gravar(acao: () => Promise<void>): Promise<Resultado> {
    try {
      await acao();
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: mensagemDeErro(e) };
    }
  }

  /** Busca no servidor (native query); devolve [] se a API estiver fora do ar. */
  async buscarProdutos(termo: string): Promise<Produto[]> {
    try {
      return await firstValueFrom(this.http.get<Produto[]>(this.url, { params: { busca: termo.trim() } }));
    } catch (e) {
      this.erro.set(mensagemDeErro(e, 'Não foi possível buscar os vinhos.'));
      return [];
    }
  }

  /** Detalhe de um vinho; undefined quando não existe (404) ou a API não responde. */
  async buscarPorId(id: number): Promise<Produto | undefined> {
    try {
      return await firstValueFrom(this.http.get<Produto>(`${this.url}/${id}`));
    } catch (e) {
      if (!(e instanceof HttpErrorResponse) || e.status !== 404) {
        this.erro.set(mensagemDeErro(e, 'Não foi possível carregar o vinho.'));
      }
      return undefined;
    }
  }
}
