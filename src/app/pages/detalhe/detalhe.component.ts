import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FotoFallbackDirective } from '../../shared/foto-fallback.directive';
import { Produto } from '../../models/produto';
import { ProdutoService } from '../../services/produto.service';
import { ToastService } from '../../services/toast.service';
import { CarrinhoService } from '../../services/carrinho.service';

@Component({
  selector: 'app-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink, FotoFallbackDirective],
  templateUrl: './detalhe.component.html',
  styleUrl: './detalhe.component.scss'
})
export class DetalheComponent implements OnInit {
  produto: Produto | undefined;
  adicionado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produtoService: ProdutoService,
    private carrinhoService: CarrinhoService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.produto = this.produtoService.getProdutoPorId(id);
      this.adicionado = false;
    });
  }

  comprar(): void {
    if (!this.produto) {
      return;
    }
    if (!this.carrinhoService.adicionar(this.produto)) {
      this.toast.mostrar(`Limite de ${this.carrinhoService.limitePorProduto} unidades por produto`);
    }
    this.adicionado = true;
    this.router.navigate(['/cesta']);
  }
}
