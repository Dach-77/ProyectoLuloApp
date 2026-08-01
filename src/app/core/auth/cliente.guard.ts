import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClienteAuthService } from './cliente-auth';

// A diferencia de adminGuard, no hay una página de login propia para clientes: si no
// está autenticado, se abre el popup de login/registro ya existente y se redirige a Inicio.
export const clienteGuard: CanActivateFn = () => {
  const clienteAuthService = inject(ClienteAuthService);
  const router = inject(Router);

  if (clienteAuthService.estaAutenticado()) {
    return true;
  }

  clienteAuthService.abrirPopup();
  return router.createUrlTree(['/']);
};
