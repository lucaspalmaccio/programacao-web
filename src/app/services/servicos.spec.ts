import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { CarrinhoService } from './carrinho.service';
import { FavoritosService } from './favoritos.service';
import { PedidoService } from './pedido.service';
import { ProdutoService } from './produto.service';
import { provideApiFalsa } from '../testing/api-falsa';
import { Produto } from '../models/produto';

const novo = {
  nome: 'Maria Silva',
  email: 'Maria@Exemplo.com',
  cpf: '529.982.247-25',
  telefone: '(11) 91234-5678',
  nascimento: '1990-05-10',
  senha: 'senha1234'
};

function limpar(): void {
  localStorage.clear();
  recarregar();
}

/** Carrega o catálogo (da API falsa) e devolve os produtos. */
async function catalogo(): Promise<Produto[]> {
  const produtos = TestBed.inject(ProdutoService);
  await produtos.carregar();
  return produtos.getProdutos();
}

/** Recria o módulo de teste (como recarregar a página) com a API em memória. */
function recarregar(): void {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideApiFalsa()] });
}

describe('ProdutoService', () => {
  beforeEach(limpar);

  it('tem os 13 vinhos do catálogo, com fotos e regiões', async () => {
    const produtos = await catalogo();
    expect(produtos.length).toBe(13);
    expect(produtos.every(p => p.foto.startsWith('vinhos/') && !!p.regiao)).toBeTrue();
    expect(new Set(produtos.map(p => p.id)).size).toBe(13);
  });

  it('cobre os 4 tipos', async () => {
    const tipos = new Set((await catalogo()).map(p => p.tipo));
    expect([...tipos].sort()).toEqual(['Branco', 'Espumante', 'Rosé', 'Tinto']);
  });

  it('busca por nome, país, uva e região sem diferenciar maiúsculas', async () => {
    const s = TestBed.inject(ProdutoService);
    expect((await s.buscarProdutos('vik')).length).toBe(1);
    expect((await s.buscarProdutos('CHILE')).length).toBeGreaterThanOrEqual(3);
    expect((await s.buscarProdutos('mendoza')).length).toBeGreaterThanOrEqual(1);
    expect((await s.buscarProdutos('inexistente-xyz')).length).toBe(0);
    expect((await s.buscarProdutos('')).length).toBe(13);
  });
});

describe('AuthService', () => {
  beforeEach(limpar);

  it('cadastra pela API, abre sessão e nunca guarda a senha no navegador', async () => {
    const auth = TestBed.inject(AuthService);
    const r = await auth.cadastrar(novo);
    expect(r.ok).toBeTrue();
    expect(auth.usuarioLogado()?.email).toBe('maria@exemplo.com');
    expect(auth.usuarioLogado()?.id).toBe(1);
    expect(auth.usuarioLogado()?.cpf).toBe('529.982.247-25');
    expect(localStorage.getItem('vinho-sessao')).not.toContain('senha1234');
  });

  it('bloqueia e-mail e CPF duplicados', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.cadastrar(novo);
    const igualEmail = await auth.cadastrar({ ...novo, cpf: '111.444.777-35' });
    expect(igualEmail.ok).toBeFalse();
    expect(igualEmail.erro).toContain('e-mail');
    const igualCpf = await auth.cadastrar({ ...novo, email: 'outra@exemplo.com', cpf: '52998224725' });
    expect(igualCpf.ok).toBeFalse();
    expect(igualCpf.erro).toContain('CPF');
  });

  it('faz login certo e recusa senha ou e-mail errados', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.cadastrar(novo);
    auth.logout();
    expect(auth.usuarioLogado()).toBeNull();

    expect((await auth.login('maria@exemplo.com', 'errada123')).ok).toBeFalse();
    expect((await auth.login('ninguem@exemplo.com', 'senha1234')).ok).toBeFalse();
    expect((await auth.login(' MARIA@exemplo.com ', 'senha1234')).ok).toBeTrue();
  });

  it('mantém a sessão ao recarregar e apaga ao sair', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.cadastrar(novo);
    recarregar();
    expect(TestBed.inject(AuthService).usuarioLogado()?.nome).toBe('Maria Silva');
    TestBed.inject(AuthService).logout();
    recarregar();
    expect(TestBed.inject(AuthService).usuarioLogado()).toBeNull();
  });

  it('atualiza o perfil e o endereço', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.cadastrar(novo);
    const endereco = { cep: '01310-100', endereco: 'Av. Paulista', numero: '1000', cidade: 'São Paulo', uf: 'SP' };
    expect((await auth.atualizarPerfil({ nome: 'Maria Souza', endereco })).ok).toBeTrue();
    expect(auth.usuarioLogado()?.nome).toBe('Maria Souza');
    expect(auth.usuarioLogado()?.endereco?.cidade).toBe('São Paulo');
  });

  it('altera a senha só com a atual correta', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.cadastrar(novo);
    expect((await auth.alterarSenha('errada123', 'nova12345')).ok).toBeFalse();
    expect((await auth.alterarSenha('senha1234', 'nova12345')).ok).toBeTrue();
    auth.logout();
    expect((await auth.login('maria@exemplo.com', 'senha1234')).ok).toBeFalse();
    expect((await auth.login('maria@exemplo.com', 'nova12345')).ok).toBeTrue();
  });

  it('não altera perfil nem senha sem estar logado', async () => {
    const auth = TestBed.inject(AuthService);
    expect((await auth.atualizarPerfil({ nome: 'X Y' })).ok).toBeFalse();
    expect((await auth.alterarSenha('a', 'b')).ok).toBeFalse();
  });
});

describe('CarrinhoService', () => {
  beforeEach(limpar);

  it('soma itens e total', async () => {
    const c = TestBed.inject(CarrinhoService);
    const [a, b] = await catalogo();
    c.adicionar(a);
    c.adicionar(a);
    c.adicionar(b);
    expect(c.totalItens()).toBe(3);
    expect(c.totalCarrinho()).toBeCloseTo(a.preco * 2 + b.preco, 2);
  });

  it('respeita o limite de 12 por produto', async () => {
    const c = TestBed.inject(CarrinhoService);
    const p = (await catalogo())[0];
    for (let i = 0; i < 12; i++) {
      expect(c.adicionar(p)).toBeTrue();
    }
    expect(c.adicionar(p)).toBeFalse();
    c.atualizarQuantidade(p.id, 99);
    expect(c.totalItens()).toBe(12);
  });

  it('remove o item ao chegar em zero e limpa a cesta', async () => {
    const c = TestBed.inject(CarrinhoService);
    const p = (await catalogo())[0];
    c.adicionar(p);
    c.atualizarQuantidade(p.id, 0);
    expect(c.itensCarrinho().length).toBe(0);
    c.adicionar(p);
    c.limparCesta();
    expect(c.totalItens()).toBe(0);
  });

  it('cobra frete abaixo de R$ 299 e dá frete grátis acima', async () => {
    const c = TestBed.inject(CarrinhoService);
    const produtos = await catalogo();
    const barato = [...produtos].sort((x, y) => x.preco - y.preco)[0];
    expect(c.frete()).toBe(0); // cesta vazia
    c.adicionar(barato);
    expect(c.frete()).toBe(c.valorFrete);
    expect(c.totalComFrete()).toBeCloseTo(barato.preco + c.valorFrete, 2);
    const caro = [...produtos].sort((x, y) => y.preco - x.preco)[0];
    c.adicionar(caro);
    expect(c.totalCarrinho()).toBeGreaterThanOrEqual(c.freteGratisA);
    expect(c.frete()).toBe(0);
  });

  it('guarda a cesta ao recarregar', async () => {
    const c = TestBed.inject(CarrinhoService);
    const p = (await catalogo())[3];
    c.adicionar(p);
    c.adicionar(p);
    TestBed.flushEffects();
    recarregar();
    const nova = TestBed.inject(CarrinhoService);
    await catalogo();
    expect(nova.totalItens()).toBe(2);
    expect(nova.itensCarrinho()[0].produto.id).toBe(p.id);
  });

  it('ignora produtos que não existem mais no catálogo', async () => {
    localStorage.setItem('vinho-carrinho', JSON.stringify([{ id: 9999, quantidade: 2 }]));
    const c = TestBed.inject(CarrinhoService);
    await catalogo();
    expect(c.totalItens()).toBe(0);
  });
});

describe('PedidoService', () => {
  beforeEach(limpar);

  const base = {
    clienteId: 1,
    itens: [{ produtoId: 3, nome: 'Casal Garcia', foto: 'vinhos/x.webp', preco: 50, quantidade: 2 }],
    frete: 0,
    endereco: { cep: '01310-100', endereco: 'Rua A', numero: '1', cidade: 'SP', uf: 'SP' },
    pagamento: 'pix'
  };

  it('grava pela API, calcula o total e lista só os pedidos do cliente, do mais novo ao mais antigo', async () => {
    const s = TestBed.inject(PedidoService);
    const p1 = await s.criar(base);
    const p2 = await s.criar(base);
    await s.criar({ ...base, clienteId: 2 });
    expect(p1.total).toBe(100);
    expect(p1.endereco.cep).toBe('01310-100');
    expect((await s.doCliente(1)).map(p => p.id)).toEqual([p2.id, p1.id]);
    expect((await s.doCliente(2)).length).toBe(1);
  });

  it('atualiza o status', async () => {
    const s = TestBed.inject(PedidoService);
    const p = await s.criar(base, 'Aguardando pagamento');
    expect(p.status).toBe('Aguardando pagamento');
    await s.atualizarStatus(p.id, 'Pagamento confirmado');
    expect((await s.doCliente(1))[0].status).toBe('Pagamento confirmado');
  });
});

describe('FavoritosService', () => {
  beforeEach(limpar);

  it('alterna e persiste favoritos', () => {
    const f = TestBed.inject(FavoritosService);
    f.alternar(10);
    expect(f.ehFavorito(10)).toBeTrue();
    TestBed.resetTestingModule();
    expect(TestBed.inject(FavoritosService).ehFavorito(10)).toBeTrue();
    TestBed.inject(FavoritosService).alternar(10);
    expect(TestBed.inject(FavoritosService).ehFavorito(10)).toBeFalse();
  });

  it('tolera dado corrompido no armazenamento', () => {
    localStorage.setItem('vinho-favoritos', '{isso nao e json');
    expect(TestBed.inject(FavoritosService).ids()).toEqual([]);
  });
});

describe('ProdutoService (detalhe)', () => {
  beforeEach(limpar);

  it('busca um vinho pelo id e devolve undefined quando não existe', async () => {
    const s = TestBed.inject(ProdutoService);
    const [primeiro] = await catalogo();
    expect((await s.buscarPorId(primeiro.id))?.nome).toBe(primeiro.nome);
    expect(await s.buscarPorId(99999)).toBeUndefined();
  });
});
