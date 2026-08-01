export interface PedidoItem {
  nombreProducto: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  id: string;
  fechaCreacion: string;
  total: number;
  estado: string;
  items: PedidoItem[];
  // Solo vienen poblados en el listado de admin; null en "mis pedidos".
  clienteNombre?: string | null;
  clienteEmail?: string | null;
}

export interface PedidoItemRequest {
  productoId: string;
  talla: string;
  color: string;
  cantidad: number;
}

export interface StockConflictoItem {
  productoId: string;
  talla: string;
  color: string;
  cantidadSolicitada: number;
  cantidadDisponible: number;
  motivo: string;
}

export interface StockConflicto {
  error: string;
  items: StockConflictoItem[];
}
