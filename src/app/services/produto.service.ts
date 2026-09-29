import { Injectable } from '@angular/core';
import { Produto } from '../models/produto';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {

  private produtos: Produto[] = [
    {
      id: 9,
      nome: 'Undurraga Late Harvest Reserva Especial',
      tipo: 'Branco',
      pais: 'Chile',
      regiao: 'Vale do Maipo',
      uva: 'Semillon/Sauvignon Blanc (Botrytis)',
      safra: 2023,
      preco: 69.90,
      foto: 'vinhos/undurraga-late-harvest.png',
      descricao: 'Vinho de sobremesa dourado e denso, com aroma doce e frutado, típico de colheita tardia.',
      harmonizacao: 'Sobremesas, queijos cremosos e frutas em calda.',
      teorAlcoolico: '13,5%',
      volume: '375ml'
    },
    {
      id: 10,
      nome: 'Casal Garcia Sweet Branco',
      tipo: 'Branco',
      pais: 'Portugal',
      regiao: 'Vinho Verde',
      uva: 'Trajadura/Loureiro/Arinto/Azal',
      safra: 2023,
      preco: 49.90,
      foto: 'vinhos/casal-garcia-branco.webp',
      descricao: 'Vinho Verde branco doce, leve e frutado, com frescor cítrico. Um clássico português, o mais vendido do mundo na categoria.',
      harmonizacao: 'Petiscos, queijos suaves, sobremesas de frutas e pratos leves de verão.',
      teorAlcoolico: '9,5%',
      volume: '750ml'
    },
    {
      id: 11,
      nome: 'Susana Balbo Signature Rosé',
      tipo: 'Rosé',
      pais: 'Argentina',
      regiao: 'Vale de Uco',
      uva: 'Malbec/Pinot Noir',
      safra: 2023,
      preco: 119.90,
      foto: 'vinhos/susana_balbo_signature_rose.webp',
      descricao: 'Rosé premium do Valle de Uco, salmão pálido, com frescor e notas de morango e groselha.',
      harmonizacao: 'Salmão defumado, frango grelhado e queijos duros.',
      teorAlcoolico: '13%',
      volume: '750ml'
    },
    {
      id: 12,
      nome: 'Calvet Murmure de Rosé Côtes de Provence',
      tipo: 'Rosé',
      pais: 'França',
      regiao: 'Provence',
      uva: 'Grenache/Cinsault/Syrah',
      safra: 2023,
      preco: 99.90,
      foto: 'vinhos/calvet_cotes_de_provence_rose.webp',
      descricao: 'Rosé clássico da Provence, rosa pálido, seco e floral, com notas de frutas vermelhas.',
      harmonizacao: 'Saladas, frutos do mar e culinária mediterrânea.',
      teorAlcoolico: '13%',
      volume: '750ml'
    },
    {
      id: 13,
      nome: 'Casa Perini Brut',
      tipo: 'Espumante',
      pais: 'Brasil',
      regiao: 'Serra Gaúcha',
      uva: 'Chardonnay/Riesling Itálico',
      safra: 2023,
      preco: 69.90,
      foto: 'vinhos/espumante_casa_perini_brut.webp',
      descricao: 'Espumante gaúcho pelo método Charmat, fresco e leve, com boa acidez.',
      harmonizacao: 'Saladas, queijos, peixes e defumados.',
      teorAlcoolico: '12%',
      volume: '750ml'
    },
    {
      id: 14,
      nome: 'Freixenet French Brut Royal',
      tipo: 'Espumante',
      pais: 'França',
      regiao: 'Vin de France',
      uva: 'Chardonnay/Colombard',
      safra: 2023,
      preco: 109.90,
      foto: 'vinhos/espumantefreixenet.webp',
      descricao: 'Espumante francês aromático, com notas de frutas brancas, flor de laranjeira e final mineral.',
      harmonizacao: 'Aperitivos, frutos do mar e massas leves.',
      teorAlcoolico: '11,5%',
      volume: '750ml'
    },
    {
      id: 15,
      nome: 'Tarapacá Gran Reserva Cabernet Sauvignon',
      tipo: 'Tinto',
      pais: 'Chile',
      regiao: 'Vale do Maipo',
      uva: 'Cabernet Sauvignon',
      safra: 2023,
      preco: 99.90,
      foto: 'vinhos/tarapaca-gran-reserva.jpg',
      descricao: 'Tinto encorpado do Vale do Maipo, com notas de ameixa, amora e especiarias, envelhecido em carvalho.',
      harmonizacao: 'Carnes vermelhas, cordeiro e queijos maduros.',
      teorAlcoolico: '14%',
      volume: '750ml'
    },
    {
      id: 16,
      nome: 'Vik',
      tipo: 'Tinto',
      pais: 'Chile',
      regiao: 'Vale de Millahue',
      uva: 'Cabernet Sauvignon/Carmenère/Cabernet Franc/Syrah',
      safra: 2020,
      preco: 899.90,
      foto: 'vinhos/vik-2020.webp',
      descricao: 'Ícone super premium do Vale de Millahue, blend complexo envelhecido 20 meses em carvalho francês.',
      harmonizacao: 'Carnes nobres, cordeiro e pratos sofisticados.',
      teorAlcoolico: '14%',
      volume: '750ml'
    },
    {
      id: 17,
      nome: 'Montes Alpha Cabernet Sauvignon',
      tipo: 'Tinto',
      pais: 'Chile',
      regiao: 'Vale de Colchagua',
      uva: 'Cabernet Sauvignon/Merlot',
      safra: 2021,
      preco: 149.90,
      foto: 'vinhos/montes-alpha-cabernet.png',
      descricao: 'Tinto premium do Vale de Colchagua, com cassis, especiarias e taninos redondos.',
      harmonizacao: 'Carnes vermelhas grelhadas e queijos curados.',
      teorAlcoolico: '14,5%',
      volume: '750ml'
    },
    {
      id: 18,
      nome: 'Cartuxa Colheita Tinto',
      tipo: 'Tinto',
      pais: 'Portugal',
      regiao: 'Alentejo',
      uva: 'Aragonez/Alicante Bouschet/Trincadeira',
      safra: 2012,
      preco: 159.90,
      foto: 'vinhos/cartuxa-colheita.webp',
      descricao: 'Tinto alentejano encorpado, produzido pela Fundação Eugénio de Almeida, tradição desde 1986.',
      harmonizacao: 'Carnes de caça, queijos maduros e ensopados.',
      teorAlcoolico: '14%',
      volume: '750ml'
    },
    {
      id: 19,
      nome: 'Viña Albali Crianza',
      tipo: 'Tinto',
      pais: 'Espanha',
      regiao: 'Valdepeñas',
      uva: 'Tempranillo',
      safra: 2018,
      preco: 59.90,
      foto: 'vinhos/vina-albali-crianza.webp',
      descricao: 'Tinto espanhol de Valdepeñas, 100% Tempranillo, com boa estrutura e envelhecimento clássico de crianza.',
      harmonizacao: 'Carnes grelhadas, queijos semicurados e massas.',
      teorAlcoolico: '13%',
      volume: '750ml'
    },
    {
      id: 20,
      nome: 'Pizzato Alicante Bouschet Reserva',
      tipo: 'Tinto',
      pais: 'Brasil',
      regiao: 'Vale dos Vinhedos',
      uva: 'Alicante Bouschet',
      safra: 2020,
      preco: 139.90,
      foto: 'vinhos/pizzato-alicante-bouschet.webp',
      descricao: 'Tinto encorpado do Vale dos Vinhedos (Bento Gonçalves), cor intensa e taninos firmes.',
      harmonizacao: 'Carnes vermelhas, churrasco e queijos maduros.',
      teorAlcoolico: '13,5%',
      volume: '750ml'
    },
    {
      id: 21,
      nome: 'Kit 6 garrafas DV Catena Cabernet Malbec',
      tipo: 'Tinto',
      pais: 'Argentina',
      regiao: 'Mendoza',
      uva: 'Cabernet Sauvignon/Malbec',
      safra: 2022,
      preco: 779.40,
      foto: 'vinhos/dv-catena-cabernet-malbec.jpg',
      descricao: 'Kit com 6 garrafas do blend de Mendoza da Catena Zapata, com frutas negras, tabaco e taninos macios.',
      harmonizacao: 'Carnes nobres e pratos sofisticados.',
      teorAlcoolico: '14%',
      volume: '6 x 750ml'
    }
  ];

  getProdutos(): Produto[] {
    return this.produtos;
  }

  getProdutoPorId(id: number): Produto | undefined {
    return this.produtos.find(p => p.id === id);
  }

  buscarProdutos(termo: string): Produto[] {
    const t = termo.trim().toLowerCase();
    if (!t) {
      return this.produtos;
    }
    return this.produtos.filter(p =>
      p.nome.toLowerCase().includes(t) ||
      p.tipo.toLowerCase().includes(t) ||
      p.pais.toLowerCase().includes(t) ||
      p.regiao.toLowerCase().includes(t) ||
      p.uva.toLowerCase().includes(t)
    );
  }
}
