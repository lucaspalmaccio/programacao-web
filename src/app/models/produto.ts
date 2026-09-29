export interface Produto {
  id: number;
  nome: string;
  tipo: 'Tinto' | 'Branco' | 'Rosé' | 'Espumante';
  pais: string;
  regiao: string;
  uva: string;
  safra: number;
  preco: number;
  foto: string;
  descricao: string;
  harmonizacao: string;
  teorAlcoolico: string;
  volume: string;
}
