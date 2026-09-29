import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Só deixa entrar quem está logado; senão leva ao login e volta depois. */
export const authGuard: CanActivateFn = (_rota, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.usuarioLogado()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: estado.url } });
};
