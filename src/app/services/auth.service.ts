import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { gravarJson, lerJson, removerChave } from './armazenamento';
import { API_URL, mensagemDeErro } from './api';
import { aplicarMascara } from '../shared/mascara.directive';

export interface Endereco {
  cep: string;
  endereco: string;
  numero: string;
  cidade: string;
  uf: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  nascimento: string;
  endereco?: Endereco;
  admin?: boolean;
  dataCadastro?: string;
  /** Token enviado à API nas rotas protegidas (só no navegador do próprio cliente). */
  token?: string;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  nascimento: string;
  senha: string;
}

export interface Resultado {
  ok: boolean;
  erro?: string;
}

const CHAVE_SESSAO = 'vinho-sessao';

/**
 * Autenticação feita pela API (backend/). Cadastro, login, perfil e senha ficam
 * no banco; no navegador guardamos só os dados do cliente logado (sem senha).
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly url = `${API_URL}/clientes`;

  usuarioLogado = signal<Usuario | null>(this.restaurarSessao());

  constructor(private http: HttpClient) {}

  async cadastrar(dados: NovoUsuario): Promise<Resultado> {
    return this.executar(async () => {
      const cliente = await firstValueFrom(this.http.post<Usuario>(this.url, {
        ...dados,
        nome: dados.nome.trim(),
        email: dados.email.trim().toLowerCase()
      }));
      this.abrirSessao(cliente);
    });
  }

  async login(email: string, senha: string): Promise<Resultado> {
    return this.executar(async () => {
      const cliente = await firstValueFrom(this.http.post<Usuario>(`${this.url}/login`, {
        email: email.trim().toLowerCase(),
        senha
      }));
      this.abrirSessao(cliente);
    });
  }

  logout(): void {
    this.usuarioLogado.set(null);
    removerChave(CHAVE_SESSAO);
  }

  async atualizarPerfil(alteracoes: Partial<Pick<Usuario, 'nome' | 'telefone' | 'nascimento' | 'endereco'>>): Promise<Resultado> {
    const atual = this.usuarioLogado();
    if (!atual) {
      return { ok: false, erro: 'Você precisa estar logado.' };
    }
    return this.executar(async () => {
      const { id, admin, token, ...cadastro } = { ...atual, ...alteracoes };
      const cliente = await firstValueFrom(this.http.put<Usuario>(`${this.url}/${id}`, cadastro));
      this.abrirSessao(cliente);
    });
  }

  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<Resultado> {
    const atual = this.usuarioLogado();
    if (!atual) {
      return { ok: false, erro: 'Você precisa estar logado.' };
    }
    return this.executar(async () => {
      await firstValueFrom(this.http.put<void>(`${this.url}/${atual.id}/senha`, { senhaAtual, novaSenha }));
    });
  }

  /** A API responde 204 exista ou não a conta, para não revelar quais e-mails estão cadastrados. */
  async solicitarRecuperacaoSenha(email: string): Promise<Resultado> {
    return this.executar(async () => {
      await firstValueFrom(this.http.post<void>(`${this.url}/reenviar-senha`, { email: email.trim().toLowerCase() }));
    });
  }

  private async executar(acao: () => Promise<void>): Promise<Resultado> {
    try {
      await acao();
      return { ok: true };
    } catch (erro) {
      return { ok: false, erro: mensagemDeErro(erro) };
    }
  }

  /** A API guarda só dígitos; na tela mostramos CPF, telefone e CEP com máscara. */
  private abrirSessao(cliente: Usuario): void {
    const usuario: Usuario = {
      ...cliente,
      // o PUT do perfil não devolve token: mantém o da sessão atual
      token: cliente.token ?? this.usuarioLogado()?.token,
      cpf: aplicarMascara(cliente.cpf, 'cpf'),
      telefone: aplicarMascara(cliente.telefone, 'telefone'),
      endereco: cliente.endereco && { ...cliente.endereco, cep: aplicarMascara(cliente.endereco.cep, 'cep') }
    };
    this.usuarioLogado.set(usuario);
    gravarJson(CHAVE_SESSAO, usuario);
  }

  private restaurarSessao(): Usuario | null {
    const salvo = lerJson<Usuario | null>(CHAVE_SESSAO, null);
    return salvo && typeof salvo.id === 'number' ? salvo : null;
  }
}
