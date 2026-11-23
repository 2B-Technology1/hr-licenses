import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, CORE_UI_CONFIG, TokenService } from '@mohammed_a4rf/core-ui';
import { GlobalResponse, isApiError } from '@mohammed_a4rf/core-ui/utils';
import { map, Observable, tap } from 'rxjs';
import { AuthUser, ChangePasswordRequest, LoginRequest, LoginSession } from '../models/auth.interface';

const AUTH_ENDPOINT = 'Auth';
export const AUTH_LOGIN_ENDPOINT = AUTH_ENDPOINT + '/login';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly config = inject(CORE_UI_CONFIG);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenService);

  private readonly endPoint = AUTH_ENDPOINT;

  private readonly currentUser = signal<AuthUser | null>(null);
  readonly user = this.currentUser.asReadonly();

  login(credentials: LoginRequest): Observable<GlobalResponse<LoginSession>> {
    return this.api.post<GlobalResponse<LoginSession>>(AUTH_LOGIN_ENDPOINT, credentials).pipe(
      tap((response) => {
        if (isApiError(response) || !response.data?.token || !response.data.user?.isActive) return;

        this.tokens.set(response.data.token);
        this.currentUser.set(response.data.user);
      }),
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    return this.api.get<GlobalResponse<AuthUser>>(this.endPoint + '/me').pipe(
      map((response) => {
        const user = !isApiError(response) && response.data?.isActive ? response.data : null;
        this.currentUser.set(user);
        return user;
      }),
    );
  }

  changePassword(body: ChangePasswordRequest): Observable<GlobalResponse<string[] | null>> {
    return this.api.post<GlobalResponse<string[] | null>>(this.endPoint + '/ChangePassword', body);
  }

  clearSession(): void {
    this.tokens.clear();
    this.currentUser.set(null);
  }

  logout(): void {
    this.clearSession();
    this.router.navigateByUrl(this.config.loginRoute, { replaceUrl: true });
  }
}
