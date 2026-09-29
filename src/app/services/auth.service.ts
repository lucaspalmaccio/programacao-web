import { Injectable, signal } from '@angular/core';
import { apenasDigitos } from '../shared/validators';
import { gravarJson, lerJson, removerChave } from './armazenamento';

export interface Endereco {
  cep: string;
  endereco: string;
  numero: string;
  cidade: string;
  uf: string;
}

export interface Usuario {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  nascimento: string;
  endereco?: Endereco;
}

interface Registro extends Usuario {
  senhaHash: string;
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

const CHAVE_USUARIOS = 'vinho-usuarios';
const CHAVE_SESSAO = 'vinho-sessao';

/**
 * Autenticação simulada para fins acadêmicos: as contas ficam no navegador
 * (localStorage) e a senha é guardada como hash SHA-256. Em um sistema real
 * isso seria feito por uma API com back-end.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  usuarioLogado = signal<Usuario | null>(this.restaurarSessao());

  async cadastrar(dados: NovoUsuario): Promise<Resultado> {
    const email = dados.email.trim().toLowerCase();
    const cpf = apenasDigitos(dados.cpf);
    const usuarios = this.listarRegistros();

    if (usuarios.some(u => u.email === email)) {
      return { ok: false, erro: 'Já existe uma conta com esse e-mail.' };
    }
    if (usuarios.some(u => apenasDigitos(u.cpf) === cpf)) {
      return { ok: false, erro: 'Já existe uma conta com esse CPF.' };
    }

    const registro: Registro = {
      nome: dados.nome.trim(),
      email,
      cpf: dados.cpf,
      telefone: dados.telefone,
      nascimento: dados.nascimento,
      senhaHash: await this.gerarHash(email, dados.senha)
    };
    gravarJson(CHAVE_USUARIOS, [...usuarios, registro]);
    this.abrirSessao(registro);
    return { ok: true };
  }

  async login(email: string, senha: string): Promise<Resultado> {
    const chave = email.trim().toLowerCase();
    const registro = this.listarRegistros().find(u => u.email === chave);
    const hash = await this.gerarHash(chave, senha);
    if (!registro || registro.senhaHash !== hash) {
      return { ok: false, erro: 'E-mail ou senha incorretos.' };
    }
    this.abrirSessao(registro);
    return { ok: true };
  }

  logout(): void {
    this.usuarioLogado.set(null);
    removerChave(CHAVE_SESSAO);
  }

  atualizarPerfil(alteracoes: Partial<Pick<Usuario, 'nome' | 'telefone' | 'nascimento' | 'endereco'>>): Resultado {
    const atual = this.usuarioLogado();
    if (!atual) {
      return { ok: false, erro: 'Você precisa estar logado.' };
    }
    const usuarios = this.listarRegistros();
    const indice = usuarios.findIndex(u => u.email === atual.email);
    if (indice < 0) {
      return { ok: false, erro: 'Conta não encontrada.' };
    }
    usuarios[indice] = { ...usuarios[indice], ...alteracoes };
    gravarJson(CHAVE_USUARIOS, usuarios);
    this.abrirSessao(usuarios[indice]);
    return { ok: true };
  }

  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<Resultado> {
    const atual = this.usuarioLogado();
    const usuarios = this.listarRegistros();
    const indice = usuarios.findIndex(u => u.email === atual?.email);
    if (!atual || indice < 0) {
      return { ok: false, erro: 'Você precisa estar logado.' };
    }
    if (usuarios[indice].senhaHash !== await this.gerarHash(atual.email, senhaAtual)) {
      return { ok: false, erro: 'A senha atual está incorreta.' };
    }
    usuarios[indice].senhaHash = await this.gerarHash(atual.email, novaSenha);
    gravarJson(CHAVE_USUARIOS, usuarios);
    return { ok: true };
  }

  solicitarRecuperacaoSenha(email: string): boolean {
    // Simulação: por segurança, a resposta é a mesma exista ou não a conta.
    return !!email;
  }

  private abrirSessao(registro: Registro): void {
    const { senhaHash, ...usuario } = registro;
    this.usuarioLogado.set(usuario);
    gravarJson(CHAVE_SESSAO, usuario);
  }

  private restaurarSessao(): Usuario | null {
    const salvo = lerJson<Usuario | null>(CHAVE_SESSAO, null);
    if (!salvo) {
      return null;
    }
    // só mantém a sessão se a conta ainda existir
    return this.listarRegistros().some(u => u.email === salvo.email) ? salvo : null;
  }

  private listarRegistros(): Registro[] {
    const lista = lerJson<Registro[]>(CHAVE_USUARIOS, []);
    return Array.isArray(lista) ? lista : [];
  }

  private async gerarHash(email: string, senha: string): Promise<string> {
    const bytes = new TextEncoder().encode(`${email}:${senha}:vinho-e-cia`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
