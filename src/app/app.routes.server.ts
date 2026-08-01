import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // El estado de sesión vive en sessionStorage (solo navegador): no tiene sentido
    // prerenderizar esta ruta, siempre "vería" un usuario no autenticado en build time.
    path: 'admin',
    renderMode: RenderMode.Client
  },
  {
    // Mismo motivo que 'admin': depende de un token de cliente en localStorage y llama
    // a un endpoint autenticado (GET /api/pedidos/mios) que no puede resolverse en build time.
    path: 'mis-pedidos',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
