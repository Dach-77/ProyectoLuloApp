import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { ClienteAuthService } from './cliente-auth';

export const clienteAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(ClienteAuthService).obtenerToken();

  if (!token || req.headers.has('Authorization')) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
