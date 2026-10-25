import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Produto } from '../../models/produto';
import { NovoProduto, ProdutoService } from '../../services/produto.service';
import { ToastService } from '../../services/toast.service';
import { FotoFallbackDirective } from '../../shared/foto-fallback.directive';

/** Cadastro, edição e exclusão de vinhos (API /api/produtos). */
@Component({
  selector: 'app-admin-vinhos',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, FotoFallbackDirective],
  templateUrl: './admin-vinhos.component.html',
  styleUrl: './admin-vinhos.component.scss'
})
export class AdminVinhosComponent implements OnInit {
  readonly tipos = ['Tinto', 'Branco', 'Rosé', 'Espumante'];

  form: FormGroup;
  /** Vinho em edição; null quando o formulário está cadastrando um novo. */
  editando: Produto | null = null;
  /** Vinho aguardando a confirmação de exclusão. */
  excluindo: Produto | null = null;
  enviado = false;
  salvando = false;
  erro = '';

  constructor(
    private fb: FormBuilder,
    public produtos: ProdutoService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      tipo: ['Tinto', [Validators.required]],
      pais: ['', [Validators.required, Validators.maxLength(60)]],
      regiao: ['', [Validators.required, Validators.maxLength(80)]],
      uva: ['', [Validators.required, Validators.maxLength(120)]],
      safra: [new Date().getFullYear() - 2, [Validators.required, Validators.min(1900), Validators.max(2100)]],
      preco: [null, [Validators.required, Validators.min(0.01)]],
      foto: ['', [Validators.maxLength(255)]],
      descricao: ['', [Validators.maxLength(1000)]],
      harmonizacao: ['', [Validators.maxLength(300)]],
      teorAlcoolico: ['', [Validators.maxLength(10)]],
      volume: ['750ml', [Validators.maxLength(20)]]
    });
  }

  ngOnInit(): void {
    this.produtos.carregar();
  }

  novo(): void {
    this.editando = null;
    this.excluindo = null;
    this.enviado = false;
    this.erro = '';
    this.form.reset({ tipo: 'Tinto', safra: new Date().getFullYear() - 2, volume: '750ml' });
  }

  editar(produto: Produto): void {
    const { id, ...dados } = produto;
    this.editando = produto;
    this.excluindo = null;
    this.enviado = false;
    this.erro = '';
    this.form.reset(dados);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async salvar(): Promise<void> {
    this.enviado = true;
    this.erro = '';
    if (this.form.invalid) {
      return;
    }
    const dados = this.paraEnvio();
    this.salvando = true;
    const resultado = this.editando
      ? await this.produtos.atualizar(this.editando.id, dados)
      : await this.produtos.criar(dados);
    this.salvando = false;
    if (!resultado.ok) {
      this.erro = resultado.erro ?? '';
      return;
    }
    this.toast.mostrar(this.editando ? 'Vinho atualizado' : 'Vinho cadastrado');
    this.novo();
  }

  pedirExclusao(produto: Produto): void {
    this.excluindo = produto;
  }

  async confirmarExclusao(): Promise<void> {
    if (!this.excluindo) {
      return;
    }
    const alvo = this.excluindo;
    const resultado = await this.produtos.excluir(alvo.id);
    this.excluindo = null;
    if (!resultado.ok) {
      this.erro = resultado.erro ?? '';
      return;
    }
    if (this.editando?.id === alvo.id) {
      this.novo();
    }
    this.toast.mostrar('Vinho excluído');
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || this.enviado);
  }

  /** Remove espaços e transforma campos opcionais vazios em null. */
  private paraEnvio(): NovoProduto {
    const v = this.form.value;
    const texto = (s: string | null) => (s ?? '').trim();
    const opcional = (s: string | null) => texto(s) || null;
    return {
      nome: texto(v.nome),
      tipo: v.tipo,
      pais: texto(v.pais),
      regiao: texto(v.regiao),
      uva: texto(v.uva),
      safra: Number(v.safra),
      preco: Number(v.preco),
      foto: opcional(v.foto),
      descricao: opcional(v.descricao),
      harmonizacao: opcional(v.harmonizacao),
      teorAlcoolico: opcional(v.teorAlcoolico),
      volume: opcional(v.volume)
    } as NovoProduto;
  }
}
