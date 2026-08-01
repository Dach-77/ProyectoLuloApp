import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { clienteAuthInterceptor } from './core/auth/cliente-auth.interceptor';
import { sesionExpiradaInterceptor } from './core/auth/sesion-expirada.interceptor';

import localeEsCO from '@angular/common/locales/es-CO';

// Sin esto, CurrencyPipe usa el locale por defecto en-US y agrupa miles con
// coma (ej. $1,250,000): para lectura colombiana eso se confunde con decimales.
registerLocaleData(localeEsCO);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-CO' },
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, clienteAuthInterceptor, sesionExpiradaInterceptor])),
  ]
};
