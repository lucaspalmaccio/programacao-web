import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Produto } from '../../models/produto';
import { ProdutoService } from '../../services/produto.service';
import { ProdutoCardComponent } from '../../shared/produto-card/produto-card.component';

@Component({
  selector: 'app-busca',
  standalone: true,
  imports: [ProdutoCardComponent],
  templateUrl: './busca.component.html',
  styleUrl: './busca.component.scss'
})
export class BuscaComponent implements OnInit {
  termo = '';
  resultados: Produto[] = [];

  constructor(
    private route: ActivatedRoute,
    private produtoService: ProdutoService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(async params => {
      this.termo = params.get('q') ?? '';
      const termo = this.termo;
      const resultados = await this.produtoService.buscarProdutos(termo);
      if (termo === this.termo) {
        this.resultados = resultados;
      }
    });
  }
}
