import { Component, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Produto } from '../../models/produto';
import { ProdutoService } from '../../services/produto.service';
import { FavoritosService } from '../../services/favoritos.service';
import { ProdutoCardComponent } from '../../shared/produto-card/produto-card.component';

type Ordem = 'relevancia' | 'menor' | 'maior' | 'nome';

@Component({
  selector: 'app-vitrine',
  standalone: true,
  imports: [RouterLink, ProdutoCardComponent],
  templateUrl: './vitrine.component.html',
  styleUrl: './vitrine.component.scss'
})
export class VitrineComponent implements OnInit {
  todos: Produto[] = [];
  produtos: Produto[] = [];
  paises: string[] = [];

  tipoSelecionado: string | null = null;
  paisSelecionado = '';
  ordem: Ordem = 'relevancia';
  somenteFavoritos = false;

  readonly tipos = ['Tinto', 'Branco', 'Rosé', 'Espumante'];

  constructor(
    private produtoService: ProdutoService,
    public favoritos: FavoritosService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.todos = this.produtoService.getProdutos();
    this.paises = [...new Set(this.todos.map(p => p.pais))].sort();
    this.route.queryParamMap.subscribe(params => {
      this.tipoSelecionado = params.get('tipo');
      this.aplicar();
    });
  }

  aplicar(): void {
    let lista = this.todos.filter(p =>
      (!this.tipoSelecionado || p.tipo === this.tipoSelecionado) &&
      (!this.paisSelecionado || p.pais === this.paisSelecionado) &&
      (!this.somenteFavoritos || this.favoritos.ehFavorito(p.id))
    );
    if (this.ordem === 'menor') {
      lista = [...lista].sort((a, b) => a.preco - b.preco);
    } else if (this.ordem === 'maior') {
      lista = [...lista].sort((a, b) => b.preco - a.preco);
    } else if (this.ordem === 'nome') {
      lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }
    this.produtos = lista;
  }

  aoMudarPais(evento: Event): void {
    this.paisSelecionado = (evento.target as HTMLSelectElement).value;
    this.aplicar();
  }

  aoMudarOrdem(evento: Event): void {
    this.ordem = (evento.target as HTMLSelectElement).value as Ordem;
    this.aplicar();
  }

  alternarFavoritos(): void {
    this.somenteFavoritos = !this.somenteFavoritos;
    this.aplicar();
  }

  limparFiltros(): void {
    this.paisSelecionado = '';
    this.ordem = 'relevancia';
    this.somenteFavoritos = false;
    this.aplicar();
  }

  get filtrosAtivos(): boolean {
    return !!this.paisSelecionado || this.somenteFavoritos || this.ordem !== 'relevancia';
  }
}
