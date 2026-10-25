import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_URL } from './api';
import { AuthService } from './auth.service';

/** Mensagens da API que indicam token ausente, inválido ou expirado (e não, p.ex., senha atual errada). */
const SESSAO_INVALIDA = /^(Faça login|Sessão inválida)/;

/**
 * Anexa o token do cliente logado às chamadas da API (só para o nosso backend) e,
 * se a API disser que a sessão não vale mais, encerra o login local.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.usuarioLogado()?.token;
  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }
  const requisicao = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(requisicao).pipe(
    catchError(erro => {
      if (erro instanceof HttpErrorResponse && erro.status === 401 && SESSAO_INVALIDA.test(erro.error?.mensagem ?? '')) {
        auth.logout();
      }
      return throwError(() => erro);
    })
  );
};
