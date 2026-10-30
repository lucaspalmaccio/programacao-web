import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Usuario } from '../../services/auth.service';
import { ClienteService, DadosCliente } from '../../services/cliente.service';
import { ToastService } from '../../services/toast.service';
import { MascaraDirective } from '../../shared/mascara.directive';
import { cpfValidator, maioridadeValidator, senhaForteValidator } from '../../shared/validators';

const CAMPOS_ENDERECO = ['cep', 'endereco', 'numero', 'cidade', 'uf'];

/** Endereço é opcional, mas se um campo for preenchido todos os outros passam a ser obrigatórios. */
function enderecoCompleto(grupo: AbstractControl): ValidationErrors | null {
  const valores = CAMPOS_ENDERECO.map(c => String(grupo.get(c)?.value ?? '').trim());
  const algum = valores.some(v => v);
  return algum && valores.some(v => !v) ? { enderecoIncompleto: true } : null;
}

/** Lista, cadastro, edição e exclusão de clientes (API /api/clientes). */
@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DatePipe, MascaraDirective],
  templateUrl: './admin-clientes.component.html',
  styleUrl: './admin-clientes.component.scss'
})
export class AdminClientesComponent implements OnInit {
  form: FormGroup;
  busca = '';
  carregando = false;
  /** Cliente em edição; null quando o formulário está cadastrando um novo. */
  editando: Usuario | null = null;
  /** Cliente aguardando a confirmação de exclusão. */
  excluindo: Usuario | null = null;
  enviado = false;
  salvando = false;
  erro = '';

  constructor(
    private fb: FormBuilder,
    public clientes: ClienteService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120), Validators.pattern(/^\S+(\s+\S+)+$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/), cpfValidator]],
      telefone: ['', [Validators.required, Validators.pattern(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/)]],
      nascimento: ['', [Validators.required, maioridadeValidator]],
      senha: ['', [Validators.required, senhaForteValidator]],
      endereco: this.fb.group({
        cep: ['', [Validators.pattern(/^\d{5}-?\d{3}$/)]],
        endereco: ['', [Validators.maxLength(150)]],
        numero: ['', [Validators.maxLength(10)]],
        cidade: ['', [Validators.maxLength(80)]],
        uf: ['', [Validators.pattern(/^[A-Za-z]{2}$/)]]
      }, { validators: enderecoCompleto })
    });
  }

  ngOnInit(): void {
    this.buscar();
  }

  async buscar(): Promise<void> {
    this.carregando = true;
    await this.clientes.carregar(this.busca);
    this.carregando = false;
  }

  limparBusca(): void {
    this.busca = '';
    this.buscar();
  }

  novo(): void {
    this.editando = null;
    this.excluindo = null;
    this.enviado = false;
    this.erro = '';
    this.form.reset();
    this.definirSenhaObrigatoria(true);
  }

  editar(cliente: Usuario): void {
    this.editando = cliente;
    this.excluindo = null;
    this.enviado = false;
    this.erro = '';
    this.form.reset({
      nome: cliente.nome, email: cliente.email, cpf: cliente.cpf, telefone: cliente.telefone,
      nascimento: cliente.nascimento, senha: '', endereco: cliente.endereco ?? {}
    });
    this.definirSenhaObrigatoria(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async salvar(): Promise<void> {
    this.enviado = true;
    this.erro = '';
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    const preenchido = CAMPOS_ENDERECO.every(c => String(v.endereco[c] ?? '').trim());
    const dados: DadosCliente = { ...v, endereco: preenchido ? v.endereco : null };
    this.salvando = true;
    const resultado = this.editando
      ? await this.clientes.atualizar(this.editando.id, dados)
      : await this.clientes.criar(dados);
    this.salvando = false;
    if (!resultado.ok) {
      this.erro = resultado.erro ?? '';
      return;
    }
    this.toast.mostrar(this.editando ? 'Cliente atualizado' : 'Cliente cadastrado');
    this.novo();
  }

  pedirExclusao(cliente: Usuario): void {
    this.excluindo = cliente;
  }

  async confirmarExclusao(): Promise<void> {
    if (!this.excluindo) {
      return;
    }
    const alvo = this.excluindo;
    const resultado = await this.clientes.excluir(alvo.id);
    this.excluindo = null;
    if (!resultado.ok) {
      this.erro = resultado.erro ?? '';
      return;
    }
    if (this.editando?.id === alvo.id) {
      this.novo();
    }
    this.toast.mostrar('Cliente excluído');
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || this.enviado);
  }

  get enderecoIncompleto(): boolean {
    return this.enviado && !!this.form.get('endereco')?.hasError('enderecoIncompleto');
  }

  /** No cadastro a senha é obrigatória; na edição, deixar em branco mantém a atual. */
  private definirSenhaObrigatoria(obrigatoria: boolean): void {
    const senha = this.form.get('senha')!;
    senha.setValidators(obrigatoria ? [Validators.required, senhaForteValidator] : [senhaForteValidator]);
    senha.updateValueAndValidity();
  }
}
