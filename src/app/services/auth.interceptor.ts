import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from './api';
import { AuthService } from './auth.service';

/** Anexa o token do cliente logado às chamadas da API (só para o nosso backend). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).usuarioLogado()?.token;
  if (!token || !req.url.startsWith(API_URL)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
