import { HttpErrorResponse, HttpInterceptorFn, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { API_URL } from '../services/api';
import { PRODUTOS_FALSOS } from './produtos-falsos';

/**
 * API em memória para os testes: imita as regras do backend (Spring Boot) sem rede.
 * Cada chamada de provideApiFalsa() cria um "banco" novo, vazio.
 */
/** Conta de administrador que o backend cria na carga inicial. */
export const ADMIN_FALSO = {
  id: 999, nome: 'Administrador Di Vino', email: 'admin@divino.com', cpf: '11144477735',
  telefone: '11999999999', nascimento: '1990-01-01', admin: true
};

export function provideApiFalsa(): EnvironmentProviders {
  const clientes: any[] = [];
  const pedidos: any[] = [];
  const produtos: any[] = PRODUTOS_FALSOS.map(p => ({ ...p }));

  const digitos = (v: string) => (v ?? '').replace(/\D/g, '');
  const erro = (status: number, mensagem: string) =>
    throwError(() => new HttpErrorResponse({ status, error: { status, mensagem } }));
  const ok = (body: unknown, status = 200) => of(new HttpResponse({ status, body }));

  const publico = (c: any) => {
    const { senha, ...resto } = c;
    return resto;
  };
  const endereco = (e: any) => e && { ...e, cep: digitos(e.cep), uf: String(e.uf).toUpperCase() };

  const interceptor: HttpInterceptorFn = (req, next): Observable<any> => {
    if (!req.url.startsWith(API_URL)) {
      return next(req);
    }
    const rota = req.url.slice(API_URL.length);
    const corpo: any = req.body;
    let m: RegExpMatchArray | null;

    if (req.method === 'GET' && rota === '/produtos') {
      const termo = (req.params.get('busca') ?? '').toLowerCase();
      return ok(produtos.filter(p =>
        !termo || [p.nome, p.tipo, p.pais, p.regiao, p.uva].some(c => c.toLowerCase().includes(termo))));
    }

    if (req.method === 'GET' && (m = rota.match(/^\/produtos\/(\d+)$/))) {
      const p = produtos.find(x => x.id === +m![1]);
      return p ? ok(p) : erro(404, `Produto ${m[1]} não encontrado.`);
    }

    if (req.method === 'POST' && rota === '/produtos') {
      if (!corpo.nome || corpo.preco <= 0) {
        return erro(400, 'Dados do produto inválidos.');
      }
      const criado = { ...corpo, id: Math.max(0, ...produtos.map(p => p.id)) + 1 };
      produtos.push(criado);
      return ok(criado, 201);
    }

    if (req.method === 'PUT' && (m = rota.match(/^\/produtos\/(\d+)$/))) {
      const p = produtos.find(x => x.id === +m![1]);
      if (!p) {
        return erro(404, `Produto ${m[1]} não encontrado.`);
      }
      Object.assign(p, corpo);
      return ok(p);
    }

    if (req.method === 'DELETE' && (m = rota.match(/^\/produtos\/(\d+)$/))) {
      const i = produtos.findIndex(x => x.id === +m![1]);
      if (i < 0) {
        return erro(404, `Produto ${m[1]} não encontrado.`);
      }
      produtos.splice(i, 1);
      return ok(null, 204);
    }

    if (req.method === 'GET' && rota === '/clientes') {
      const nome = (req.params.get('nome') ?? '').trim().toLowerCase();
      return ok([ADMIN_FALSO, ...clientes.map(publico)].filter(c => !nome || c.nome.toLowerCase().includes(nome)));
    }

    if (req.method === 'DELETE' && (m = rota.match(/^\/clientes\/(\d+)$/))) {
      const i = clientes.findIndex(x => x.id === +m![1]);
      if (i < 0) {
        return erro(404, 'Cliente não encontrado.');
      }
      if (pedidos.some(p => p.clienteId === clientes[i].id)) {
        return erro(409, 'Cliente possui pedidos e não pode ser excluído.');
      }
      clientes.splice(i, 1);
      return ok(null, 204);
    }

    if (req.method === 'POST' && rota === '/clientes') {
      const email = corpo.email.trim().toLowerCase();
      const cpf = digitos(corpo.cpf);
      if (clientes.some(c => c.email === email)) {
        return erro(409, 'Já existe uma conta com esse e-mail.');
      }
      if (clientes.some(c => c.cpf === cpf)) {
        return erro(409, 'Já existe uma conta com esse CPF.');
      }
      const cliente = {
        id: Math.max(0, ...clientes.map(x => x.id)) + 1, nome: corpo.nome.trim(), email, cpf, telefone: digitos(corpo.telefone),
        nascimento: corpo.nascimento, senha: corpo.senha, endereco: endereco(corpo.endereco),
        dataCadastro: new Date().toISOString()
      };
      clientes.push(cliente);
      return ok(publico(cliente), 201);
    }

    if (req.method === 'POST' && rota === '/uploads/vinhos') {
      const arquivo = (corpo as FormData).get('arquivo') as File | null;
      return arquivo ? ok({ url: `http://localhost:8080/uploads/vinhos/${arquivo.name}` }, 201)
                     : erro(400, 'Selecione uma imagem.');
    }

    if (req.method === 'POST' && rota === '/clientes/login'
        && corpo.email.trim().toLowerCase() === ADMIN_FALSO.email && corpo.senha === 'Admin@123') {
      return ok({ ...ADMIN_FALSO, token: 'token-falso' });
    }

    if (req.method === 'POST' && rota === '/clientes/login') {
      const c = clientes.find(x => x.email === corpo.email.trim().toLowerCase() && x.senha === corpo.senha);
      return c ? ok(publico(c)) : erro(401, 'E-mail ou senha incorretos.');
    }

    if (req.method === 'POST' && rota === '/clientes/reenviar-senha') {
      return ok(null, 204);
    }

    if (req.method === 'PUT' && (m = rota.match(/^\/clientes\/(\d+)$/))) {
      const c = clientes.find(x => x.id === +m![1]);
      if (!c) {
        return erro(404, 'Cliente não encontrado.');
      }
      const email = corpo.email.trim().toLowerCase();
      const cpf = digitos(corpo.cpf);
      if (clientes.some(x => x.id !== c.id && x.email === email)) {
        return erro(409, 'Já existe outra conta com esse e-mail.');
      }
      if (clientes.some(x => x.id !== c.id && x.cpf === cpf)) {
        return erro(409, 'Já existe outra conta com esse CPF.');
      }
      if (corpo.senha) {
        c.senha = corpo.senha;
      }
      Object.assign(c, {
        nome: corpo.nome.trim(), email, cpf, telefone: digitos(corpo.telefone), nascimento: corpo.nascimento,
        endereco: corpo.endereco ? endereco(corpo.endereco) : c.endereco
      });
      return ok(publico(c));
    }

    if (req.method === 'PUT' && (m = rota.match(/^\/clientes\/(\d+)\/senha$/))) {
      const c = clientes.find(x => x.id === +m![1]);
      if (!c) {
        return erro(404, 'Cliente não encontrado.');
      }
      if (c.senha !== corpo.senhaAtual) {
        return erro(401, 'A senha atual está incorreta.');
      }
      c.senha = corpo.novaSenha;
      return ok(null, 204);
    }

    if (req.method === 'POST' && rota === '/pedidos') {
      const subtotal = corpo.itens.reduce((s: number, i: any) => s + i.preco * i.quantidade, 0);
      const pedido = {
        id: pedidos.length + 1, clienteId: corpo.clienteId, data: new Date().toISOString(), itens: corpo.itens,
        subtotal, frete: corpo.frete, total: subtotal + corpo.frete, endereco: endereco(corpo.endereco),
        pagamento: corpo.pagamento, status: corpo.status || 'Pedido recebido'
      };
      pedidos.push(pedido);
      return ok(pedido, 201);
    }

    if (req.method === 'GET' && rota === '/pedidos') {
      const id = req.params.get('clienteId');
      return ok(pedidos.filter(p => id === null || p.clienteId === +id).reverse());
    }

    if (req.method === 'PUT' && (m = rota.match(/^\/pedidos\/(\d+)\/status$/))) {
      const p = pedidos.find(x => x.id === +m![1]);
      if (!p) {
        return erro(404, 'Pedido não encontrado.');
      }
      p.status = corpo.status;
      return ok(p);
    }

    return erro(404, `Rota não simulada: ${req.method} ${rota}`);
  };

  return provideHttpClient(withInterceptors([interceptor])) as unknown as EnvironmentProviders;
}
