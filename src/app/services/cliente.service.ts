import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL, mensagemDeErro } from './api';
import { Endereco, Usuario } from './auth.service';
import { aplicarMascara } from '../shared/mascara.directive';
import { apenasDigitos } from '../shared/validators';

/** Dados cadastrais de um cliente; a senha só é obrigatória no cadastro. */
export interface DadosCliente {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  nascimento: string;
  senha?: string | null;
  endereco?: Endereco | null;
}

export interface Resultado {
  ok: boolean;
  erro?: string;
}

/**
 * Clientes vindos da API (backend/), para o administrador: lista, cadastra, edita e exclui.
 * A lista fica em memória (`clientes`) e é atualizada a cada operação.
 */
@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly url = `${API_URL}/clientes`;

  clientes = signal<Usuario[]>([]);
  /** Mensagem do último erro ao carregar a lista (vazia quando deu certo). */
  erro = signal('');

  constructor(private http: HttpClient) {}

  /** Carrega todos os clientes, ou só os que contêm `nome` quando informado. */
  async carregar(nome = ''): Promise<void> {
    const params = nome.trim() ? { nome: nome.trim() } : undefined;
    try {
      const lista = await firstValueFrom(this.http.get<Usuario[]>(this.url, { params }));
      this.clientes.set(lista.map(c => this.paraTela(c)));
      this.erro.set('');
    } catch (e) {
      this.erro.set(mensagemDeErro(e, 'Não foi possível carregar os clientes.'));
    }
  }

  async criar(dados: DadosCliente): Promise<Resultado> {
    return this.gravar(async () => {
      const criado = await firstValueFrom(this.http.post<Usuario>(this.url, this.paraEnvio(dados)));
      this.clientes.update(lista => [...lista, this.paraTela(criado)]);
    });
  }

  async atualizar(id: number, dados: DadosCliente): Promise<Resultado> {
    return this.gravar(async () => {
      const novo = await firstValueFrom(this.http.put<Usuario>(`${this.url}/${id}`, this.paraEnvio(dados)));
      this.clientes.update(lista => lista.map(c => c.id === id ? this.paraTela(novo) : c));
    });
  }

  async excluir(id: number): Promise<Resultado> {
    return this.gravar(async () => {
      await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
      this.clientes.update(lista => lista.filter(c => c.id !== id));
    });
  }

  private async gravar(acao: () => Promise<void>): Promise<Resultado> {
    try {
      await acao();
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: mensagemDeErro(e) };
    }
  }

  /** A API guarda só dígitos; na tela mostramos CPF, telefone e CEP com máscara. */
  private paraTela(c: Usuario): Usuario {
    return {
      ...c,
      cpf: aplicarMascara(c.cpf, 'cpf'),
      telefone: aplicarMascara(c.telefone, 'telefone'),
      endereco: c.endereco && { ...c.endereco, cep: aplicarMascara(c.endereco.cep, 'cep') }
    };
  }

  private paraEnvio(d: DadosCliente): DadosCliente {
    return {
      nome: d.nome.trim(),
      email: d.email.trim().toLowerCase(),
      cpf: apenasDigitos(d.cpf),
      telefone: apenasDigitos(d.telefone),
      nascimento: d.nascimento,
      senha: d.senha || null,
      endereco: d.endereco ?? null
    };
  }
}
