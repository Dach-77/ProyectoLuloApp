import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Producto } from '../models/producto.model';
import { Observable, firstValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface ResultadoPaginado<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// El catálogo actual es pequeño y no tiene UI de paginación todavía, así que pedimos
// una página generosa para conservar el comportamiento de "traer todo" mientras el
// backend ya soporta paginación real de cara a cuando el catálogo crezca.
const TAMANO_PAGINA = 100;

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  // Catálogo público (solo activos) o inventario del admin (incluirInactivos = true)
  obtenerProductos(incluirInactivos = false): Observable<Producto[]> {
    return this.http
      .get<ResultadoPaginado<Producto>>(this.apiUrl, { params: { incluirInactivos, pageSize: TAMANO_PAGINA } })
      .pipe(map(resultado => resultado.items));
  }

  // Guarda una prenda nueva junto con al menos una foto de color (la primera subida
  // se usa como portada del producto — no hay un campo de "foto principal" separado)
  async guardarProductoConImagen(producto: Producto, imagenesPorColor: Record<string, File>) {
    const formData = this.construirFormData(producto, imagenesPorColor);
    return await firstValueFrom(this.http.post<Producto>(this.apiUrl, formData));
  }

  // Edita una prenda ya existente. Si no se adjunta foto nueva para algún color, la
  // API conserva la que ya tenía para ese color (y la portada actual, si ninguna cambió).
  async actualizarProducto(id: string, cambios: Producto, imagenesPorColor?: Record<string, File>) {
    const formData = this.construirFormData(cambios, imagenesPorColor);
    return await firstValueFrom(this.http.put<Producto>(`${this.apiUrl}/${id}`, formData));
  }

  // Activa o desactiva un producto (se sigue viendo en el inventario, no en el catálogo)
  async cambiarEstado(id: string, activo: boolean) {
    return await firstValueFrom(this.http.patch<Producto>(`${this.apiUrl}/${id}/estado`, { activo }));
  }

  // Elimina un producto por completo (irreversible)
  async eliminarProducto(id: string) {
    return await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
  }

  private construirFormData(producto: Producto, imagenesPorColor?: Record<string, File>): FormData {
    const formData = new FormData();
    formData.append('nombre', producto.nombre);
    formData.append('codigo', producto.codigo);
    formData.append('genero', producto.genero);
    formData.append('materiales', this.comoCsv(producto.materiales));
    formData.append('temporadas', this.comoCsv(producto.temporadas));
    formData.append('stockJson', JSON.stringify(producto.stock ?? []));
    formData.append('precio', producto.precio.toString());
    formData.append('descripcion', producto.descripcion ?? '');
    // El backend identifica estos campos de foto por color por el nombre del campo del
    // multipart (ver ExtraerFotosPorColor en ProductosController).
    for (const [color, archivo] of Object.entries(imagenesPorColor ?? {})) {
      formData.append(`fotoColor:${color}`, archivo);
    }
    return formData;
  }

  private comoCsv(valores: string[] | string): string {
    return Array.isArray(valores) ? valores.join(',') : String(valores ?? '');
  }
}
