import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { CarrinhoService } from './carrinho.service';
import { FavoritosService } from './favoritos.service';
import { PedidoService } from './pedido.service';
import { ProdutoService } from './produto.service';

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
  TestBed.resetTestingModule();
}

describe('ProdutoService', () => {
  beforeEach(limpar);

  it('tem os 13 vinhos do catálogo, com fotos e regiões', () => {
    const produtos = TestBed.inject(ProdutoService).getProdutos();
    expect(produtos.length).toBe(13);
    expect(produtos.every(p => p.foto.startsWith('vinhos/') && !!p.regiao)).toBeTrue();
    expect(new Set(produtos.map(p => p.id)).size).toBe(13);
  });

  it('cobre os 4 tipos', () => {
    const tipos = new Set(TestBed.inject(ProdutoService).getProdutos().map(p => p.tipo));
    expect([...tipos].sort()).toEqual(['Branco', 'Espumante', 'Rosé', 'Tinto']);
  });

  it('busca por nome, país, uva e região sem diferenciar maiúsculas', () => {
    const s = TestBed.inject(ProdutoService);
    expect(s.buscarProdutos('vik').length).toBe(1);
    expect(s.buscarProdutos('CHILE').length).toBeGreaterThanOrEqual(3);
    expect(s.buscarProdutos('mendoza').length).toBeGreaterThanOrEqual(1);
    expect(s.buscarProdutos('inexistente-xyz').length).toBe(0);
    expect(s.buscarProdutos('').length).toBe(13);
  });
});

describe('AuthService', () => {
  beforeEach(limpar);

  it('cadastra, abre sessão e guarda hash (nunca a senha)', async () => {
    const auth = TestBed.inject(AuthService);
    const r = await auth.cadastrar(novo);
    expect(r.ok).toBeTrue();
    expect(auth.usuarioLogado()?.email).toBe('maria@exemplo.com');
    expect(localStorage.getItem('vinho-usuarios')).not.toContain('senha1234');
    expect(localStorage.getItem('vinho-sessao')).not.toContain('senhaHash');
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
    TestBed.resetTestingModule();
    expect(TestBed.inject(AuthService).usuarioLogado()?.nome).toBe('Maria Silva');
    TestBed.inject(AuthService).logout();
    TestBed.resetTestingModule();
    expect(TestBed.inject(AuthService).usuarioLogado()).toBeNull();
  });

  it('atualiza o perfil e o endereço', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.cadastrar(novo);
    const endereco = { cep: '01310-100', endereco: 'Av. Paulista', numero: '1000', cidade: 'São Paulo', uf: 'SP' };
    expect(auth.atualizarPerfil({ nome: 'Maria Souza', endereco }).ok).toBeTrue();
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
    expect(auth.atualizarPerfil({ nome: 'X Y' }).ok).toBeFalse();
    expect((await auth.alterarSenha('a', 'b')).ok).toBeFalse();
  });
});

describe('CarrinhoService', () => {
  beforeEach(limpar);

  it('soma itens e total', () => {
    const c = TestBed.inject(CarrinhoService);
    const [a, b] = TestBed.inject(ProdutoService).getProdutos();
    c.adicionar(a);
    c.adicionar(a);
    c.adicionar(b);
    expect(c.totalItens()).toBe(3);
    expect(c.totalCarrinho()).toBeCloseTo(a.preco * 2 + b.preco, 2);
  });

  it('respeita o limite de 12 por produto', () => {
    const c = TestBed.inject(CarrinhoService);
    const p = TestBed.inject(ProdutoService).getProdutos()[0];
    for (let i = 0; i < 12; i++) {
      expect(c.adicionar(p)).toBeTrue();
    }
    expect(c.adicionar(p)).toBeFalse();
    c.atualizarQuantidade(p.id, 99);
    expect(c.totalItens()).toBe(12);
  });

  it('remove o item ao chegar em zero e limpa a cesta', () => {
    const c = TestBed.inject(CarrinhoService);
    const p = TestBed.inject(ProdutoService).getProdutos()[0];
    c.adicionar(p);
    c.atualizarQuantidade(p.id, 0);
    expect(c.itensCarrinho().length).toBe(0);
    c.adicionar(p);
    c.limparCesta();
    expect(c.totalItens()).toBe(0);
  });

  it('cobra frete abaixo de R$ 299 e dá frete grátis acima', () => {
    const c = TestBed.inject(CarrinhoService);
    const produtos = TestBed.inject(ProdutoService).getProdutos();
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

  it('guarda a cesta ao recarregar', () => {
    const c = TestBed.inject(CarrinhoService);
    const p = TestBed.inject(ProdutoService).getProdutos()[3];
    c.adicionar(p);
    c.adicionar(p);
    TestBed.flushEffects();
    TestBed.resetTestingModule();
    const nova = TestBed.inject(CarrinhoService);
    expect(nova.totalItens()).toBe(2);
    expect(nova.itensCarrinho()[0].produto.id).toBe(p.id);
  });

  it('ignora produtos que não existem mais no catálogo', () => {
    localStorage.setItem('vinho-carrinho', JSON.stringify([{ id: 9999, quantidade: 2 }]));
    expect(TestBed.inject(CarrinhoService).totalItens()).toBe(0);
  });
});

describe('PedidoService', () => {
  beforeEach(limpar);

  const base = {
    emailUsuario: 'a@a.com',
    itens: [],
    subtotal: 100,
    frete: 0,
    total: 100,
    endereco: { cep: '01310-100', endereco: 'Rua A', numero: '1', cidade: 'SP', uf: 'SP' },
    pagamento: 'pix'
  };

  it('numera a partir de 1001 e lista só os pedidos do usuário, do mais novo ao mais antigo', () => {
    const s = TestBed.inject(PedidoService);
    const p1 = s.criar(base);
    const p2 = s.criar(base);
    s.criar({ ...base, emailUsuario: 'b@b.com' });
    expect(p1.id).toBe(1001);
    expect(p2.id).toBe(1002);
    expect(s.doUsuario('a@a.com').map(p => p.id)).toEqual([1002, 1001]);
    expect(s.doUsuario('b@b.com').length).toBe(1);
  });

  it('atualiza o status', () => {
    const s = TestBed.inject(PedidoService);
    const p = s.criar(base, 'Aguardando pagamento');
    s.atualizarStatus(p.id, 'Pagamento confirmado');
    expect(s.doUsuario('a@a.com')[0].status).toBe('Pagamento confirmado');
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
