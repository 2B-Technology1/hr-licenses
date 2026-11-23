import { registerLocaleData } from '@angular/common';
import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import localeAr from '@angular/common/locales/ar';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import {
  authInterceptor,
  CORE_UI_CONFIG,
  errorHandlerInterceptor,
  isApiRequest,
  LanguageService,
  provideCoreUi,
  successInterceptor,
} from '@mohammed_a4rf/core-ui';
import {
  provideTranslateLoader,
  provideTranslateService,
  TranslateLoader,
  TranslationObject,
  TranslateService,
} from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AppRoutes } from './core/app-routes';
import { AUTH_LOGIN_ENDPOINT } from './core/auth/services/auth.service';

registerLocaleData(localeAr);

class SuperAdminTranslateLoader implements TranslateLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<TranslationObject>(`./assets/i18n/${lang}.json`);
  }
}

const apiLanguageInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url, inject(CORE_UI_CONFIG))) return next(request);

  const language = inject(LanguageService).lang();
  return next(request.clone({ setHeaders: { 'Accept-Language': language } }));
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        apiLanguageInterceptor,
        authInterceptor,
        // The sign-in form displays its own errors beside the submit button.
        (request, next) =>
          request.url === environment.apiBaseUrl + '/' + AUTH_LOGIN_ENDPOINT
            ? next(request)
            : errorHandlerInterceptor(request, next),
        successInterceptor,
      ]),
    ),
    provideCoreUi({
      apiBaseUrl: environment.apiBaseUrl,
      loginRoute: '/' + AppRoutes.Login,
      homeRoute: '/' + AppRoutes.Dashboard,
      tokenStorageKey: 'superAdminToken',
      languageStorageKey: 'superAdminLanguage',
      defaultLanguage: 'ar',
      languages: ['ar', 'en'],
    }),
    provideTranslateService({ loader: provideTranslateLoader(SuperAdminTranslateLoader) }),
    provideAppInitializer(() => {
      inject(LanguageService).init();
      return inject(TranslateService).get('auth.brand');
    }),
  ],
};
