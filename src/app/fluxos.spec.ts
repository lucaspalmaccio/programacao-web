import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Router, provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { CarrinhoService } from './services/carrinho.service';
import { PedidoService } from './services/pedido.service';
import { ProdutoService } from './services/produto.service';

registerLocaleData(localePt);

const pausa = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const usuario = {
  nome: 'Maria Silva',
  email: 'maria@exemplo.com',
  cpf: '529.982.247-25',
  telefone: '(11) 91234-5678',
  nascimento: '1990-05-10',
  senha: 'senha1234'
};

describe('Fluxos da aplicação (regressão ponta a ponta)', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;

  const el = () => fixture.nativeElement as HTMLElement;
  const q = <T extends Element = HTMLElement>(sel: string) => el().querySelector<T>(sel);
  const qa = <T extends Element = HTMLElement>(sel: string) => Array.from(el().querySelectorAll<T>(sel));

  async function ir(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function estabilizar(ms = 60): Promise<void> {
    await pausa(ms);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function digitar(sel: string, valor: string): void {
    const campo = q<HTMLInputElement>(sel)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function clicar(sel: string): void {
    q(sel)!.click();
    fixture.detectChanges();
  }

  function textoBotao(texto: string): HTMLButtonElement | undefined {
    return qa<HTMLButtonElement>('button').find(b => b.textContent!.trim().includes(texto));
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes), { provide: LOCALE_ID, useValue: 'pt-BR' }]
    });
    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // ---------- Confirmação de idade ----------
  describe('Confirmação de 18 anos', () => {
    it('aparece na primeira visita e bloqueia até confirmar', () => {
      expect(q('.gate')).not.toBeNull();
      expect(q('.gate')!.textContent).toContain('18 anos');
    });

    it('"Não" mostra acesso restrito e mantém bloqueado; "Voltar" retorna à pergunta', () => {
      textoBotao('Não')!.click();
      fixture.detectChanges();
      expect(q('.gate')!.textContent).toContain('Acesso restrito');
      textoBotao('Voltar')!.click();
      fixture.detectChanges();
      expect(q('.gate')!.textContent).toContain('18 anos ou mais?');
    });

    it('"Sim" libera o site e lembra a escolha', () => {
      textoBotao('Sim')!.click();
      fixture.detectChanges();
      expect(q('.gate')).toBeNull();
      expect(localStorage.getItem('vinho-maior-18')).toBe('1');
    });
  });

  // ---------- Header e menu ----------
  describe('Header e menu consistentes', () => {
    for (const url of ['/', '/busca?q=vik', '/produto/9', '/cesta', '/login']) {
      it(`aparece igual em ${url}`, async () => {
        await ir(url);
        expect(qa('app-header').length).toBe(1);
        expect(q('header.sticky-top')).not.toBeNull();
        expect(q('header app-logo')).not.toBeNull();
        expect(q('header input[type="search"]')).not.toBeNull();
        expect(q('header a[href="/cesta"]')).not.toBeNull();
        expect(q('header a[href="/login"]')).not.toBeNull();
        expect(qa('header nav a').map(a => a.textContent!.trim())).toEqual(['Tintos', 'Brancos', 'Rosés', 'Espumantes']);
      });
    }

    it('o botão OK da busca leva ao resultado com "Pesquisa por:"', async () => {
      await ir('/');
      digitar('header input[type="search"]', 'malbec');
      q('header form')!.dispatchEvent(new Event('submit'));
      await estabilizar();
      expect(router.url).toBe('/busca?q=malbec');
      expect(q('main')!.textContent).toContain('Pesquisa por:');
      expect(q('main')!.textContent).toContain('malbec');
    });
  });

  // ---------- Vitrine ----------
  describe('Vitrine', () => {
    beforeEach(() => ir('/'));

    it('mostra os 13 produtos com foto, nome, preço e botão Comprar', () => {
      const cards = qa('app-produto-card');
      expect(cards.length).toBe(13);
      for (const c of cards) {
        expect(c.querySelector('img')).not.toBeNull();
        expect(c.querySelector('h3')!.textContent!.trim().length).toBeGreaterThan(2);
        expect(c.textContent).toContain('R$');
        expect(c.textContent).toContain('Comprar');
      }
    });

    it('cada card mostra tipo/uva e país/região', () => {
      const primeiro = qa('app-produto-card')[0].textContent!;
      const p = TestBed.inject(ProdutoService).getProdutos()[0];
      expect(primeiro).toContain(`${p.tipo}, ${p.uva}`);
      expect(primeiro).toContain(`${p.pais}, ${p.regiao}`);
    });

    it('só a FOTO leva ao detalhe', async () => {
      const card = qa('app-produto-card')[1];
      const links = Array.from(card.querySelectorAll('a'));
      expect(links.length).toBe(1);
      expect(links[0].querySelector('img')).not.toBeNull();
      links[0].click();
      await estabilizar();
      expect(router.url).toBe('/produto/10');
    });

    it('"Comprar" adiciona ao carrinho, avisa e NÃO navega', async () => {
      textoBotao('Comprar')!.click();
      fixture.detectChanges();
      expect(TestBed.inject(CarrinhoService).totalItens()).toBe(1);
      expect(router.url).toBe('/');
      expect(q('.toast-vinho')!.textContent).toContain('foi para a cesta');
      expect(q('header .badge')!.textContent!.trim()).toBe('1');
    });

    it('filtra por tipo pelos chips', async () => {
      const chip = qa('a.chip').find(a => a.textContent!.trim() === 'Espumante')!;
      chip.click();
      await estabilizar();
      expect(qa('app-produto-card').length).toBe(2);
    });

    it('filtra por país e ordena por menor preço', () => {
      const pais = q<HTMLSelectElement>('#filtroPais')!;
      pais.value = 'Chile';
      pais.dispatchEvent(new Event('change'));
      const ordem = q<HTMLSelectElement>('#ordenar')!;
      ordem.value = 'menor';
      ordem.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      const precos = qa('app-produto-card').map(c => Number(c.textContent!.match(/R\$ ([\d.]+)/)![1]));
      expect(precos.length).toBe(4);
      expect(precos).toEqual([...precos].sort((a, b) => a - b));
    });

    it('favorita pelo coração e filtra só favoritos', () => {
      q<HTMLButtonElement>('app-produto-card .btn-favorito')!.click();
      fixture.detectChanges();
      textoBotao('Favoritos')!.click();
      fixture.detectChanges();
      expect(qa('app-produto-card').length).toBe(1);
    });

    it('mostra estado vazio ao filtrar sem resultado', () => {
      textoBotao('Favoritos')!.click();
      fixture.detectChanges();
      expect(qa('app-produto-card').length).toBe(0);
      expect(q('main')!.textContent).toContain('Nenhum vinho encontrado');
    });
  });

  // ---------- Busca ----------
  describe('Busca', () => {
    it('exibe "Pesquisa por: [termo]" e os resultados', async () => {
      await ir('/busca?q=chile');
      expect(q('main p')!.textContent).toContain('Pesquisa por:');
      expect(q('main p')!.textContent).toContain('chile');
      expect(qa('app-produto-card').length).toBe(4);
    });

    it('avisa quando não há resultados', async () => {
      await ir('/busca?q=zzzz');
      expect(q('main')!.textContent).toContain('Nenhum vinho encontrado');
    });
  });

  // ---------- Detalhe ----------
  describe('Detalhe', () => {
    it('mostra foto à esquerda e nome/descrição à direita; Comprar leva à Cesta', async () => {
      await ir('/produto/16');
      const colunas = qa('main .row > div');
      expect(colunas[0].querySelector('img')).not.toBeNull();
      expect(colunas[1].querySelector('h1')!.textContent).toContain('Vik');
      expect(colunas[1].textContent).toContain('Ícone super premium');
      textoBotao('Comprar')!.click();
      await estabilizar();
      expect(router.url).toBe('/cesta');
      expect(TestBed.inject(CarrinhoService).totalItens()).toBe(1);
    });

    it('produto inexistente mostra mensagem amigável', async () => {
      await ir('/produto/99999');
      expect(q('main')!.textContent).toContain('Produto não encontrado');
    });
  });

  // ---------- Login / Cadastro ----------
  describe('Login e cadastro', () => {
    beforeEach(() => ir('/login'));

    it('mostra as duas colunas do wireframe', () => {
      const t = q('main')!.textContent!;
      expect(t).toContain('Já tenho cadastro');
      expect(t).toContain('Ainda não tenho cadastro');
      expect(textoBotao('Entrar')).toBeDefined();
      expect(textoBotao('Esqueci minha senha')).toBeDefined();
      expect(textoBotao('Clique Aqui')).toBeDefined();
    });

    it('valida login vazio', () => {
      textoBotao('Entrar')!.click();
      fixture.detectChanges();
      expect(qa('.invalid-feedback').length).toBe(2);
    });

    it('login com conta inexistente mostra erro', async () => {
      digitar('#loginEmail', 'x@x.com');
      digitar('#loginSenha', 'qualquer1');
      textoBotao('Entrar')!.click();
      await estabilizar();
      expect(q('.alert-danger')!.textContent).toContain('E-mail ou senha incorretos');
      expect(router.url).toBe('/login');
    });

    it('"Clique Aqui" abre o cadastro com todos os campos, mantendo o login visível', () => {
      textoBotao('Clique Aqui')!.click();
      fixture.detectChanges();
      for (const id of ['#nome', '#cadastroEmail', '#cpf', '#nascimento', '#telefone', '#senha', '#confirmaSenha', '#termos']) {
        expect(q(id)).withContext(id).not.toBeNull();
      }
      expect(q('#loginEmail')).not.toBeNull();
    });

    it('cadastro inválido mostra todos os erros e não cria conta', () => {
      textoBotao('Clique Aqui')!.click();
      fixture.detectChanges();
      textoBotao('Cadastrar')!.click();
      fixture.detectChanges();
      expect(qa('#cadastroEmail ~ .invalid-feedback, #cpf ~ .invalid-feedback, #nome ~ .invalid-feedback').length).toBe(3);
      expect(localStorage.getItem('vinho-usuarios')).toBeNull();
    });

    it('cadastro exige 18 anos, CPF válido, senha forte e senhas iguais', () => {
      textoBotao('Clique Aqui')!.click();
      fixture.detectChanges();
      digitar('#nome', 'Joao');
      digitar('#cpf', '11111111111');
      digitar('#nascimento', new Date().toISOString().slice(0, 10));
      digitar('#senha', 'abc');
      digitar('#confirmaSenha', 'xyz');
      textoBotao('Cadastrar')!.click();
      fixture.detectChanges();
      const textos = qa('.invalid-feedback').map(e => e.textContent!.trim());
      expect(textos.some(t => t.includes('nome e sobrenome'))).toBeTrue();
      expect(textos.some(t => t.includes('CPF'))).toBeTrue();
      expect(textos.some(t => t.includes('18 anos'))).toBeTrue();
      expect(textos.some(t => t.includes('8 ou mais'))).toBeTrue();
      expect(textos.some(t => t.includes('não coincidem'))).toBeTrue();
    });

    it('máscara formata CPF, telefone enquanto digita', () => {
      textoBotao('Clique Aqui')!.click();
      fixture.detectChanges();
      digitar('#cpf', '52998224725');
      digitar('#telefone', '11912345678');
      expect(q<HTMLInputElement>('#cpf')!.value).toBe('529.982.247-25');
      expect(q<HTMLInputElement>('#telefone')!.value).toBe('(11) 91234-5678');
    });

    it('cadastro válido cria a conta, entra e vai para a vitrine', async () => {
      textoBotao('Clique Aqui')!.click();
      fixture.detectChanges();
      digitar('#nome', usuario.nome);
      digitar('#cadastroEmail', usuario.email);
      digitar('#cpf', usuario.cpf);
      digitar('#nascimento', usuario.nascimento);
      digitar('#telefone', usuario.telefone);
      digitar('#senha', usuario.senha);
      digitar('#confirmaSenha', usuario.senha);
      const termos = q<HTMLInputElement>('#termos')!;
      termos.click();
      fixture.detectChanges();
      textoBotao('Cadastrar')!.click();
      await pausa(150); // sem whenStable: ele esperaria o redirecionamento agendado
      fixture.detectChanges();
      expect(TestBed.inject(AuthService).usuarioLogado()?.email).toBe(usuario.email);
      expect(q('.alert-success')!.textContent).toContain('Cadastro realizado');
      await estabilizar(1400);
      expect(router.url).toBe('/');
      expect(q('header .usuario-link')!.textContent).toContain('Maria');
    });

    it('"Esqueci minha senha" abre o modal com fundo escuro; OK valida e confirma', async () => {
      textoBotao('Esqueci minha senha')!.click();
      fixture.detectChanges();
      expect(q('.overlay')).not.toBeNull();
      expect(q('.overlay')!.textContent).toContain('Informe o seu email');
      q('.overlay button[type="submit"]')!.click();
      fixture.detectChanges();
      expect(q('.overlay .invalid-feedback')).not.toBeNull();
      digitar('#emailRecuperacao', 'maria@exemplo.com');
      q('.overlay button[type="submit"]')!.click();
      fixture.detectChanges();
      expect(q('.overlay .alert-success')).not.toBeNull();
      textoBotao('Voltar ao login')!.click();
      fixture.detectChanges();
      expect(q('.overlay')).toBeNull();
    });

    it('o modal fecha com Esc e clicando no fundo', () => {
      textoBotao('Esqueci minha senha')!.click();
      fixture.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(q('.overlay')).toBeNull();
      textoBotao('Esqueci minha senha')!.click();
      fixture.detectChanges();
      q('.overlay')!.click();
      fixture.detectChanges();
      expect(q('.overlay')).toBeNull();
    });
  });

  // ---------- Rotas protegidas ----------
  describe('Rotas protegidas', () => {
    it('/perfil e /pedidos exigem login e guardam o destino', async () => {
      await ir('/perfil');
      expect(router.url).toBe('/login?returnUrl=%2Fperfil');
      await ir('/pedidos');
      expect(router.url).toBe('/login?returnUrl=%2Fpedidos');
    });

    it('logado, entra normalmente; /login redireciona para o perfil', async () => {
      await TestBed.inject(AuthService).cadastrar(usuario);
      await ir('/perfil');
      expect(router.url).toBe('/perfil');
      expect(q('main')!.textContent).toContain('Meu perfil');
      await ir('/login');
      await estabilizar();
      expect(router.url).toBe('/perfil');
    });

    it('não aceita returnUrl externo (open redirect)', async () => {
      const auth = TestBed.inject(AuthService);
      await auth.cadastrar(usuario);
      auth.logout();
      await ir('/login?returnUrl=//evil.com');
      digitar('#loginEmail', usuario.email);
      digitar('#loginSenha', usuario.senha);
      textoBotao('Entrar')!.click();
      await estabilizar(150);
      expect(router.url).toBe('/');
    });
  });

  // ---------- Cesta e pedido ----------
  describe('Cesta e finalização', () => {
    const produtos = () => TestBed.inject(ProdutoService).getProdutos();
    const carrinho = () => TestBed.inject(CarrinhoService);

    it('cesta vazia mostra aviso e link para a vitrine', async () => {
      await ir('/cesta');
      expect(q('main')!.textContent).toContain('Sua cesta está vazia');
    });

    it('tabela tem Item | Qtd | Valor, total e botões Limpar Cesta / Finalizar', async () => {
      carrinho().adicionar(produtos()[0]);
      await ir('/cesta');
      expect(qa('thead th').map(t => t.textContent!.trim())).toEqual(['Item', 'Qtd', 'Valor']);
      expect(q('tfoot')!.textContent).toContain('Total');
      expect(textoBotao('Limpar Cesta')).toBeDefined();
      expect(textoBotao('Finalizar')).toBeDefined();
    });

    it('+ e − alteram a quantidade e recalculam; Limpar Cesta esvazia', async () => {
      carrinho().adicionar(produtos()[0]);
      await ir('/cesta');
      q('button[aria-label="Aumentar quantidade"]')!.click();
      fixture.detectChanges();
      expect(carrinho().totalItens()).toBe(2);
      q('button[aria-label="Diminuir quantidade"]')!.click();
      fixture.detectChanges();
      q('button[aria-label="Diminuir quantidade"]')!.click();
      fixture.detectChanges();
      expect(carrinho().totalItens()).toBe(0);
      expect(q('main')!.textContent).toContain('Sua cesta está vazia');
    });

    it('SEM LOGIN, Finalizar leva ao login (não deixa comprar) e mantém a cesta', async () => {
      carrinho().adicionar(produtos()[0]);
      await ir('/cesta');
      textoBotao('Finalizar')!.click();
      await estabilizar();
      expect(router.url).toBe('/login?returnUrl=%2Fcesta');
      expect(q('.alert-warning')!.textContent).toContain('finalizar a compra');
      expect(carrinho().totalItens()).toBe(1);
      expect(localStorage.getItem('vinho-pedidos')).toBeNull();
    });

    it('logado: valida o formulário de entrega antes de criar o pedido', async () => {
      await TestBed.inject(AuthService).cadastrar(usuario);
      carrinho().adicionar(produtos()[0]);
      await ir('/cesta');
      textoBotao('Finalizar')!.click();
      fixture.detectChanges();
      textoBotao('Confirmar pedido')!.click();
      fixture.detectChanges();
      expect(qa('form .invalid-feedback').length).toBeGreaterThanOrEqual(6);
      expect(localStorage.getItem('vinho-pedidos')).toBeNull();
    });

    async function preencherEntrega(pagamento: string): Promise<void> {
      digitar('#cep', '01310100');
      digitar('#endereco', 'Avenida Paulista');
      digitar('#numero', '1000');
      digitar('#uf', 'sp');
      digitar('#cidade', 'São Paulo');
      const sel = q<HTMLSelectElement>('#pagamento')!;
      sel.value = pagamento;
      sel.dispatchEvent(new Event('change'));
      q<HTMLInputElement>('#maioridade')!.click();
      fixture.detectChanges();
    }

    it('cartão: pedido aprovado na hora, salva endereço no perfil e limpa a cesta', async () => {
      const auth = TestBed.inject(AuthService);
      await auth.cadastrar(usuario);
      carrinho().adicionar(produtos()[0]);
      await ir('/cesta');
      textoBotao('Finalizar')!.click();
      fixture.detectChanges();
      await preencherEntrega('cartao');
      textoBotao('Confirmar pedido')!.click();
      fixture.detectChanges();

      const pedidos = TestBed.inject(PedidoService).doUsuario(usuario.email);
      expect(pedidos.length).toBe(1);
      expect(pedidos[0].status).toBe('Pagamento aprovado');
      expect(pedidos[0].endereco.cep).toBe('01310-100');
      expect(pedidos[0].endereco.uf).toBe('SP');
      expect(pedidos[0].total).toBeCloseTo(produtos()[0].preco + carrinho().valorFrete, 2);
      expect(q('.alert-success')!.textContent).toContain('Pedido #1001');
      expect(carrinho().totalItens()).toBe(0);
      expect(auth.usuarioLogado()?.endereco?.cidade).toBe('São Paulo');
    });

    it('próximo pedido já vem com o endereço salvo preenchido', async () => {
      const auth = TestBed.inject(AuthService);
      await auth.cadastrar(usuario);
      auth.atualizarPerfil({ endereco: { cep: '01310-100', endereco: 'Avenida Paulista', numero: '1000', cidade: 'São Paulo', uf: 'SP' } });
      carrinho().adicionar(produtos()[0]);
      await ir('/cesta');
      textoBotao('Finalizar')!.click();
      fixture.detectChanges();
      await estabilizar();
      expect(q<HTMLInputElement>('#cidade')!.value).toBe('São Paulo');
    });

    it('PIX: mostra QR, contador e copia e cola; confirma sozinho e atualiza o pedido', async () => {
      const auth = TestBed.inject(AuthService);
      await auth.cadastrar(usuario);
      carrinho().adicionar(produtos()[0]);
      await ir('/cesta');
      textoBotao('Finalizar')!.click();
      fixture.detectChanges();
      await preencherEntrega('pix');
      textoBotao('Confirmar pedido')!.click();
      fixture.detectChanges();

      expect(q('.pix')!.textContent).toContain('Pague com Pix');
      expect(q('app-pix-qr svg')).not.toBeNull();
      expect(qa('app-pix-qr rect').length).toBeGreaterThan(100);
      expect(q('.pix')!.textContent).toContain('Aguardando pagamento');
      expect(q('.pix')!.textContent).toMatch(/0[45]:\d\d/);
      expect(q<HTMLInputElement>('#codigoPix')!.value).toContain('divino-simulado-1001');
      expect(TestBed.inject(PedidoService).doUsuario(usuario.email)[0].status).toBe('Aguardando pagamento');

      await pausa(10500);
      fixture.detectChanges();
      expect(q('.pix')).toBeNull();
      expect(q('.alert-success')!.textContent).toContain('Pagamento confirmado');
      expect(TestBed.inject(PedidoService).doUsuario(usuario.email)[0].status).toBe('Pagamento confirmado');
    }, 25000);

    it('o QR Code é o mesmo para o mesmo pedido e diferente entre pedidos', async () => {
      const { PixQrComponent } = await import('./shared/pix-qr/pix-qr.component');
      const gerar = (semente: string): string => {
        const f = TestBed.createComponent(PixQrComponent);
        f.componentRef.setInput('semente', semente);
        f.detectChanges();
        return f.nativeElement.innerHTML;
      };
      expect(gerar('pedido-1')).toBe(gerar('pedido-1'));
      expect(gerar('pedido-1')).not.toBe(gerar('pedido-2'));
    });

    it('boleto: fica aguardando pagamento', async () => {
      await TestBed.inject(AuthService).cadastrar(usuario);
      carrinho().adicionar(produtos()[0]);
      await ir('/cesta');
      textoBotao('Finalizar')!.click();
      fixture.detectChanges();
      await preencherEntrega('boleto');
      textoBotao('Confirmar pedido')!.click();
      fixture.detectChanges();
      expect(TestBed.inject(PedidoService).doUsuario(usuario.email)[0].status).toBe('Aguardando pagamento');
      expect(q('.alert-success')!.textContent).toContain('boleto');
    });

    it('cesta grande ganha frete grátis e a barra mostra isso', async () => {
      carrinho().adicionar(produtos()[15 - 9]);
      carrinho().adicionar(produtos()[15 - 9]);
      carrinho().adicionar(produtos()[15 - 9]);
      await ir('/cesta');
      expect(q('.frete')!.textContent).toContain('frete grátis');
      expect(q('tfoot')!.textContent).toContain('Grátis');
    });
  });

  // ---------- Perfil e pedidos ----------
  describe('Perfil e Meus pedidos', () => {
    beforeEach(async () => {
      await TestBed.inject(AuthService).cadastrar(usuario);
    });

    it('edita dados pessoais e mostra CPF/e-mail bloqueados', async () => {
      await ir('/perfil');
      expect(q<HTMLInputElement>('#pCpf')!.disabled).toBeTrue();
      expect(q<HTMLInputElement>('#pEmail')!.disabled).toBeTrue();
      digitar('#pNome', 'Maria Souza Lima');
      textoBotao('Salvar dados')!.click();
      fixture.detectChanges();
      expect(TestBed.inject(AuthService).usuarioLogado()?.nome).toBe('Maria Souza Lima');
    });

    it('recusa nome incompleto no perfil', async () => {
      await ir('/perfil');
      digitar('#pNome', 'Maria');
      textoBotao('Salvar dados')!.click();
      fixture.detectChanges();
      expect(TestBed.inject(AuthService).usuarioLogado()?.nome).toBe('Maria Silva');
    });

    it('salva endereço e valida CEP', async () => {
      await ir('/perfil');
      digitar('#eCep', '123');
      textoBotao('Salvar endereço')!.click();
      fixture.detectChanges();
      expect(TestBed.inject(AuthService).usuarioLogado()?.endereco).toBeUndefined();
      digitar('#eCep', '01310100');
      digitar('#eEndereco', 'Avenida Paulista');
      digitar('#eNumero', '10');
      digitar('#eUf', 'sp');
      digitar('#eCidade', 'São Paulo');
      textoBotao('Salvar endereço')!.click();
      fixture.detectChanges();
      expect(TestBed.inject(AuthService).usuarioLogado()?.endereco?.uf).toBe('SP');
    });

    it('altera a senha com a atual correta e recusa a errada', async () => {
      await ir('/perfil');
      digitar('#sAtual', 'errada1234');
      digitar('#sNova', 'nova12345');
      digitar('#sConfirma', 'nova12345');
      textoBotao('Alterar senha')!.click();
      await estabilizar(100);
      expect(q('.alert-danger')!.textContent).toContain('senha atual está incorreta');
      digitar('#sAtual', usuario.senha);
      textoBotao('Alterar senha')!.click();
      await estabilizar(100);
      TestBed.inject(AuthService).logout();
      expect((await TestBed.inject(AuthService).login(usuario.email, 'nova12345')).ok).toBeTrue();
    });

    it('Sair encerra a sessão e volta à vitrine', async () => {
      await ir('/perfil');
      const sair = qa<HTMLButtonElement>('main button').find(b => b.textContent!.includes('Sair'))!;
      sair.click();
      await estabilizar();
      expect(TestBed.inject(AuthService).usuarioLogado()).toBeNull();
      expect(router.url).toBe('/');
    });

    it('menu do usuário no header traz Perfil, Pedidos e Sair', async () => {
      await ir('/');
      q<HTMLButtonElement>('header .usuario-link')!.click();
      fixture.detectChanges();
      const itens = qa('.menu-usuario [role="menuitem"]').map(i => i.textContent!.trim());
      expect(itens).toEqual(['Meu perfil', 'Meus pedidos', 'Sair']);
    });

    it('Meus pedidos: vazio e com histórico', async () => {
      await ir('/pedidos');
      expect(q('main')!.textContent).toContain('ainda não fez nenhum pedido');
      TestBed.inject(PedidoService).criar({
        emailUsuario: usuario.email,
        itens: [{ produtoId: 9, nome: 'Undurraga', foto: 'vinhos/x.png', preco: 69.9, quantidade: 2 }],
        subtotal: 139.8,
        frete: 24.9,
        total: 164.7,
        endereco: { cep: '01310-100', endereco: 'Rua A', numero: '1', cidade: 'São Paulo', uf: 'SP' },
        pagamento: 'pix'
      }, 'Pagamento confirmado');
      await ir('/');
      await ir('/pedidos');
      expect(q('main')!.textContent).toContain('Pedido #1001');
      expect(q('main')!.textContent).toContain('Pagamento confirmado');
      expect(q('main')!.textContent).toContain('164,70');
    });
  });

  // ---------- Identidade visual ----------
  describe('Identidade visual', () => {
    it('a logo "Di Vino" está no header', async () => {
      await ir('/');
      const svg = q('header app-logo svg')!;
      expect(svg.getAttribute('aria-label')).toBe('Di Vino');
      expect(svg.querySelector('text')!.textContent).toBe('Di Vino');
      expect(svg.querySelectorAll('ellipse').length).toBe(2);
    });
  });
});
