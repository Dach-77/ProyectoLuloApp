export interface StockItem {
  talla: string;
  color: string;
  cantidad: number;
}

export interface ImagenColor {
  color: string;
  imagenUrl: string;
}

export interface Producto {
  id?: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  genero: string;
  fechaCreacion?: string;
  materiales: string[];
  temporadas: string[];
  tallas: string[];
  colores: string[];
  stock: StockItem[];
  precio: number;
  imagenUrl: string;
  descripcion: string;
  imagenesPorColor: ImagenColor[];
}
