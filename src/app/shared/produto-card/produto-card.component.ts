import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FotoFallbackDirective } from '../foto-fallback.directive';
import { Produto } from '../../models/produto';
import { CarrinhoService } from '../../services/carrinho.service';
import { FavoritosService } from '../../services/favoritos.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-produto-card',
  standalone: true,
  imports: [RouterLink, FotoFallbackDirective],
  templateUrl: './produto-card.component.html',
  styleUrl: './produto-card.component.scss'
})
export class ProdutoCardComponent {
  @Input({ required: true }) produto!: Produto;

  constructor(
    private carrinhoService: CarrinhoService,
    public favoritos: FavoritosService,
    private toast: ToastService
  ) {}

  comprar(): void {
    if (this.carrinhoService.adicionar(this.produto)) {
      this.toast.mostrar(`${this.produto.nome} foi para a cesta`);
    } else {
      this.toast.mostrar(`Limite de ${this.carrinhoService.limitePorProduto} unidades por produto`);
    }
  }
}
