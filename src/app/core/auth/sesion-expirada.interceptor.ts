import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';
import { ClienteAuthService } from './cliente-auth';

// Ni estaAutenticado() ni adminGuard vuelven a fijarse en expiresAtUtc una vez que el
// token ya quedó guardado: sin esto, cuando el JWT vence en el backend, la UI seguía
// mostrando al admin/cliente como logueado indefinidamente y cada acción fallaba en
// silencio con un alert genérico ("Hubo un error...") en vez de cerrar la sesión.
export const sesionExpiradaInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const clienteAuthService = inject(ClienteAuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (authService.estaAutenticado()) {
          authService.logout();
          router.navigateByUrl('/login');
        } else if (clienteAuthService.estaAutenticado()) {
          clienteAuthService.logout();
        }
      }
      return throwError(() => error);
    })
  );
};
