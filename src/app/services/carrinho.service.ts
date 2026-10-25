import { Injectable, signal, computed, effect } from '@angular/core';
import { Produto } from '../models/produto';
import { ProdutoService } from './produto.service';
import { gravarJson, lerJson } from './armazenamento';

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

interface ItemSalvo {
  id: number;
  quantidade: number;
}

const CHAVE = 'vinho-carrinho';

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {

  /** Limite de unidades por produto em um mesmo pedido. */
  readonly limitePorProduto = 12;
  /** Compras a partir deste valor têm frete grátis. */
  readonly freteGratisA = 299;
  readonly valorFrete = 24.9;

  private itens = signal<ItemCarrinho[]>([]);

  itensCarrinho = computed(() => this.itens());

  totalItens = computed(() =>
    this.itens().reduce((soma, item) => soma + item.quantidade, 0)
  );

  totalCarrinho = computed(() =>
    this.itens().reduce((soma, item) => soma + item.quantidade * item.produto.preco, 0)
  );

  frete = computed(() =>
    this.itens().length === 0 || this.totalCarrinho() >= this.freteGratisA ? 0 : this.valorFrete
  );

  totalComFrete = computed(() => this.totalCarrinho() + this.frete());

  /** Só grava a cesta depois de restaurá-la, para não apagar a cesta salva antes do catálogo chegar. */
  private restaurada = false;

  constructor(private produtoService: ProdutoService) {
    effect(() => {
      const itens = this.itens();
      if (this.restaurada) {
        gravarJson(CHAVE, itens.map(i => ({ id: i.produto.id, quantidade: i.quantidade })));
      }
    });
    this.produtoService.carregar().then(() => this.restaurar());
  }

  /** Retorna false quando o limite por produto já foi atingido. */
  adicionar(produto: Produto): boolean {
    const listaAtual = this.itens();
    const existente = listaAtual.find(i => i.produto.id === produto.id);

    if (existente) {
      if (existente.quantidade >= this.limitePorProduto) {
        return false;
      }
      this.itens.set(
        listaAtual.map(i =>
          i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      );
    } else {
      this.itens.set([...listaAtual, { produto, quantidade: 1 }]);
    }
    return true;
  }

  removerItem(produtoId: number): void {
    this.itens.set(this.itens().filter(i => i.produto.id !== produtoId));
  }

  atualizarQuantidade(produtoId: number, quantidade: number): void {
    if (quantidade <= 0) {
      this.removerItem(produtoId);
      return;
    }
    const nova = Math.min(quantidade, this.limitePorProduto);
    this.itens.set(
      this.itens().map(i =>
        i.produto.id === produtoId ? { ...i, quantidade: nova } : i
      )
    );
  }

  limparCesta(): void {
    this.itens.set([]);
  }

  /** Recupera a cesta salva (o catálogo já está carregado); itens adicionados nesse meio-tempo são mantidos. */
  private restaurar(): void {
    if (this.produtoService.getProdutos().length === 0) {
      return; // catálogo indisponível: mantém a cesta salva intacta
    }
    const salvos = lerJson<ItemSalvo[]>(CHAVE, []);
    const itens = [...this.itens()];
    for (const s of Array.isArray(salvos) ? salvos : []) {
      const produto = this.produtoService.getProdutoPorId(s.id);
      if (produto && s.quantidade > 0 && !itens.some(i => i.produto.id === produto.id)) {
        itens.push({ produto, quantidade: Math.min(s.quantidade, this.limitePorProduto) });
      }
    }
    this.restaurada = true;
    this.itens.set(itens);
  }
}
