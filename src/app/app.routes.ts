import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/auth.guard';
import { clienteGuard } from './core/auth/cliente.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/inicio/inicio').then(m => m.Inicio) },                   // Ruta principal (Ej: luloapp.com/)
  { path: 'catalogo', loadComponent: () => import('./features/catalogo/catalogo').then(m => m.Catalogo) },      // Catálogo completo con filtros
  { path: 'admin', loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard), canActivate: [adminGuard] }, // Ruta protegida (Ej: luloapp.com/admin)
  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.Login) },
  { path: 'mis-pedidos', loadComponent: () => import('./features/mis-pedidos/mis-pedidos').then(m => m.MisPedidos), canActivate: [clienteGuard] },
  { path: 'configuraciones', loadComponent: () => import('./features/configuraciones/configuraciones').then(m => m.Configuraciones) },
  { path: '**', redirectTo: '' },
];
