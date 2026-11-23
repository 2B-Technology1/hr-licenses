import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { authGuard, CORE_UI_CONFIG } from '@mohammed_a4rf/core-ui';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './services/auth.service';

export const sessionGuard: CanActivateFn = (route, state) => {
  const access = authGuard(route, state);
  if (access !== true) return access;

  const auth = inject(AuthService);
  if (auth.user()) return true;

  const router = inject(Router);
  const config = inject(CORE_UI_CONFIG);

  const redirectToLogin = () => {
    auth.clearSession();
    return router.parseUrl(config.loginRoute);
  };

  return auth.restoreSession().pipe(
    map((user) => (user ? true : redirectToLogin())),
    catchError(() => of(redirectToLogin())),
  );
};
