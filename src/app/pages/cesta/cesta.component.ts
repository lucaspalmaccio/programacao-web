import { Component, OnDestroy } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FotoFallbackDirective } from '../../shared/foto-fallback.directive';
import { MascaraDirective } from '../../shared/mascara.directive';
import { CarrinhoService } from '../../services/carrinho.service';
import { AuthService } from '../../services/auth.service';
import { Pedido, PedidoService } from '../../services/pedido.service';
import { ToastService } from '../../services/toast.service';
import { PixQrComponent } from '../../shared/pix-qr/pix-qr.component';

/** Validade do Pix e tempo que a simulação leva para "confirmar", em segundos. */
const VALIDADE_PIX = 300;
const CONFIRMACAO_PIX = 9;

@Component({
  selector: 'app-cesta',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, FotoFallbackDirective, MascaraDirective, PixQrComponent],
  templateUrl: './cesta.component.html',
  styleUrl: './cesta.component.scss'
})
export class CestaComponent implements OnDestroy {
  pedidoCriado: Pedido | null = null;

  // Simulação de Pix (tudo local, nenhum pagamento real)
  pixRestante = VALIDADE_PIX;
  pixConfirmado = false;
  codigoPix = '';
  private relogio: ReturnType<typeof setInterval> | null = null;
  private decorrido = 0;
  entregaEnviada = false;
  emEntrega = false;
  formEntrega: FormGroup;

  constructor(
    public carrinhoService: CarrinhoService,
    private authService: AuthService,
    private pedidoService: PedidoService,
    private toast: ToastService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.formEntrega = this.fb.group({
      cep: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      endereco: ['', [Validators.required, Validators.minLength(5)]],
      numero: ['', [Validators.required, Validators.pattern(/^\d+[A-Za-z]?$/)]],
      cidade: ['', [Validators.required, Validators.minLength(2)]],
      uf: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      pagamento: ['', [Validators.required]],
      salvarEndereco: [true],
      maioridade: [false, [Validators.requiredTrue]]
    });
  }

  get faltaParaFrete(): number {
    return Math.max(0, this.carrinhoService.freteGratisA - this.carrinhoService.totalCarrinho());
  }

  get progressoFrete(): number {
    return Math.min(100, (this.carrinhoService.totalCarrinho() / this.carrinhoService.freteGratisA) * 100);
  }

  campoInvalido(campo: string): boolean {
    const c = this.formEntrega.get(campo);
    return !!c && c.invalid && (c.touched || this.entregaEnviada);
  }

  aumentar(produtoId: number, quantidadeAtual: number): void {
    if (quantidadeAtual >= this.carrinhoService.limitePorProduto) {
      this.toast.mostrar(`Limite de ${this.carrinhoService.limitePorProduto} unidades por produto`);
      return;
    }
    this.carrinhoService.atualizarQuantidade(produtoId, quantidadeAtual + 1);
  }

  diminuir(produtoId: number, quantidadeAtual: number): void {
    this.carrinhoService.atualizarQuantidade(produtoId, quantidadeAtual - 1);
  }

  remover(produtoId: number): void {
    this.carrinhoService.removerItem(produtoId);
  }

  limparCesta(): void {
    this.carrinhoService.limparCesta();
  }

  /** Só quem tem conta pode finalizar: sem login, vai para o cadastro e volta para a cesta. */
  iniciarEntrega(): void {
    if (this.carrinhoService.itensCarrinho().length === 0) {
      return;
    }
    const usuario = this.authService.usuarioLogado();
    if (!usuario) {
      this.toast.mostrar('Entre ou cadastre-se para finalizar a compra');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cesta' } });
      return;
    }
    if (usuario.endereco) {
      this.formEntrega.patchValue(usuario.endereco);
    }
    this.emEntrega = true;
  }

  voltarParaCesta(): void {
    this.emEntrega = false;
    this.entregaEnviada = false;
  }

  confirmarPedido(): void {
    this.entregaEnviada = true;
    const usuario = this.authService.usuarioLogado();
    if (!usuario) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cesta' } });
      return;
    }
    if (this.carrinhoService.itensCarrinho().length === 0 || this.formEntrega.invalid) {
      this.formEntrega.markAllAsTouched();
      return;
    }

    const { cep, endereco, numero, cidade, uf, pagamento, salvarEndereco } = this.formEntrega.value;
    const enderecoPedido = { cep, endereco, numero, cidade, uf: String(uf).toUpperCase() };

    this.pedidoCriado = this.pedidoService.criar({
      emailUsuario: usuario.email,
      itens: this.carrinhoService.itensCarrinho().map(i => ({
        produtoId: i.produto.id,
        nome: i.produto.nome,
        foto: i.produto.foto,
        preco: i.produto.preco,
        quantidade: i.quantidade
      })),
      subtotal: this.carrinhoService.totalCarrinho(),
      frete: this.carrinhoService.frete(),
      total: this.carrinhoService.totalComFrete(),
      endereco: enderecoPedido,
      pagamento
    }, this.statusInicial(pagamento));

    if (salvarEndereco) {
      this.authService.atualizarPerfil({ endereco: enderecoPedido });
    }
    this.carrinhoService.limparCesta();

    if (pagamento === 'pix') {
      this.iniciarPix();
    }
  }

  private statusInicial(pagamento: string): string {
    if (pagamento === 'pix' || pagamento === 'boleto') {
      return 'Aguardando pagamento';
    }
    return 'Pagamento aprovado';
  }

  // ---- Simulação do Pix ----

  get pixMinutos(): string {
    const m = Math.floor(this.pixRestante / 60).toString().padStart(2, '0');
    const s = (this.pixRestante % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get progressoPix(): number {
    return (this.pixRestante / VALIDADE_PIX) * 100;
  }

  iniciarPix(): void {
    this.pararRelogio();
    this.pixConfirmado = false;
    this.pixRestante = VALIDADE_PIX;
    this.decorrido = 0;
    if (this.pedidoCriado) {
      this.codigoPix = this.gerarCodigoPix(this.pedidoCriado);
    }

    this.relogio = setInterval(() => {
      this.decorrido++;
      this.pixRestante = Math.max(0, VALIDADE_PIX - this.decorrido);

      if (this.decorrido >= CONFIRMACAO_PIX) {
        this.confirmarPix();
      }
    }, 1000);
  }

  private confirmarPix(): void {
    this.pararRelogio();
    this.pixConfirmado = true;
    if (this.pedidoCriado) {
      this.pedidoService.atualizarStatus(this.pedidoCriado.id, 'Pagamento confirmado');
      this.pedidoCriado = { ...this.pedidoCriado, status: 'Pagamento confirmado' };
    }
    this.toast.mostrar('Pagamento confirmado!');
  }

  async copiarCodigoPix(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.codigoPix);
      this.toast.mostrar('Código Pix copiado');
    } catch {
      this.toast.mostrar('Não foi possível copiar. Selecione o código e copie manualmente.');
    }
  }

  private gerarCodigoPix(pedido: Pedido): string {
    const valor = pedido.total.toFixed(2);
    return `00020126580014BR.GOV.BCB.PIX0136divino-simulado-${pedido.id}` +
      `520400005303986540${valor.length}${valor}5802BR5906DI VINO6009SAO PAULO6304SIMU`;
  }

  private pararRelogio(): void {
    if (this.relogio) {
      clearInterval(this.relogio);
      this.relogio = null;
    }
  }

  ngOnDestroy(): void {
    this.pararRelogio();
  }
}
