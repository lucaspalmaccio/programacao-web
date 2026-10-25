import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { API_URL } from './api';

const sessao = { id: 1, nome: 'Maria Silva', email: 'm@x.com', cpf: '52998224725', telefone: '11912345678',
  nascimento: '1990-05-10', token: 'abc.def' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  function iniciar(logado: boolean): void {
    localStorage.clear();
    if (logado) {
      localStorage.setItem('vinho-sessao', JSON.stringify(sessao));
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  it('envia o token nas chamadas da API quando há login', () => {
    iniciar(true);
    http.get(`${API_URL}/pedidos`).subscribe();
    const req = backend.expectOne(`${API_URL}/pedidos`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc.def');
    req.flush([]);
  });

  it('não envia token sem login nem para outros endereços', () => {
    iniciar(false);
    http.get(`${API_URL}/produtos`).subscribe();
    expect(backend.expectOne(`${API_URL}/produtos`).request.headers.has('Authorization')).toBeFalse();

    iniciar(true);
    http.get('https://outro-site.com/x').subscribe();
    expect(backend.expectOne('https://outro-site.com/x').request.headers.has('Authorization')).toBeFalse();
  });

  it('encerra o login quando a API diz que a sessão expirou', () => {
    iniciar(true);
    const auth = TestBed.inject(AuthService);
    http.get(`${API_URL}/pedidos`).subscribe({ error: () => undefined });
    backend.expectOne(`${API_URL}/pedidos`).flush(
      { mensagem: 'Sessão inválida ou expirada. Entre novamente.' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.usuarioLogado()).toBeNull();
    expect(localStorage.getItem('vinho-sessao')).toBeNull();
  });

  it('mantém o login quando o 401 é outra coisa (ex.: senha atual errada)', () => {
    iniciar(true);
    const auth = TestBed.inject(AuthService);
    http.put(`${API_URL}/clientes/1/senha`, {}).subscribe({ error: () => undefined });
    backend.expectOne(`${API_URL}/clientes/1/senha`).flush(
      { mensagem: 'A senha atual está incorreta.' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.usuarioLogado()).not.toBeNull();
  });
});
