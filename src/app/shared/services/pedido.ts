import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, map } from 'rxjs';
import { Pedido, PedidoItemRequest } from '../models/pedido.model';
import { environment } from '../../../environments/environment';

interface ResultadoPaginado<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const TAMANO_PAGINA = 100;

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private readonly apiUrl = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) {}

  // Crea el pedido y descuenta el stock en el backend. Rechaza con un HttpErrorResponse
  // cuyo .status es 409 y .error tiene la forma StockConflicto si alguna línea del
  // carrito ya no tiene stock suficiente (ver StockConflicto en pedido.model.ts).
  async crearPedido(items: PedidoItemRequest[]): Promise<Pedido> {
    return await firstValueFrom(this.http.post<Pedido>(this.apiUrl, { items }));
  }

  // Historial de compras del cliente autenticado
  obtenerMisPedidos(): Observable<Pedido[]> {
    return this.http
      .get<ResultadoPaginado<Pedido>>(`${this.apiUrl}/mios`, { params: { pageSize: TAMANO_PAGINA } })
      .pipe(map(resultado => resultado.items));
  }

  // Todas las órdenes entrantes (panel de admin)
  obtenerTodosPedidos(): Observable<Pedido[]> {
    return this.http
      .get<ResultadoPaginado<Pedido>>(this.apiUrl, { params: { pageSize: TAMANO_PAGINA } })
      .pipe(map(resultado => resultado.items));
  }
}
