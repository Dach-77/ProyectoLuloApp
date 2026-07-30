import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // El estado de sesión vive en sessionStorage (solo navegador): no tiene sentido
    // prerenderizar esta ruta, siempre "vería" un usuario no autenticado en build time.
    path: 'admin',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
