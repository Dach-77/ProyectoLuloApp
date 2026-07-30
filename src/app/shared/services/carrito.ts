import { Injectable, signal, computed } from '@angular/core';
import { Producto } from '../models/producto.model';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  // Signal en vez de un arreglo mutable plano: esta app no carga zone.js, así que
  // mutar un arreglo normal (this.items.push(...)) no le avisa a Angular que debe
  // volver a renderizar OTROS componentes (ej. el total en el navbar) cuando el
  // carrito cambia desde una tarjeta de producto. Con signal(), cada .update()
  // notifica automáticamente a cualquier vista que haya leído el valor.
  private readonly itemsSignal = signal<ItemCarrito[]>([]);

  private readonly totalSignal = computed(() =>
    this.itemsSignal().reduce((total, item) => total + (item.producto.precio * item.cantidad), 0)
  );

  // Construye la variante talla+color de un producto y la agrega al carrito. Usado tanto
  // desde el modal de vista rápida del catálogo como desde cada tarjeta de producto, para
  // no duplicar la misma lógica de armado de variante en dos componentes distintos.
  agregarVarianteAlCarrito(producto: Producto, talla: string, color: string) {
    const productoConVariante: Producto = {
      ...producto,
      id: `${producto.id}-${talla}-${color}`,
      nombre: `${producto.nombre} (Talla ${talla}, ${color})`
    };
    this.agregarAlCarrito(productoConVariante);
  }

  // 1. Agregar o sumar cantidad
  agregarAlCarrito(producto: Producto) {
    this.itemsSignal.update(items => {
      const yaExiste = items.some(item => item.producto.id === producto.id);
      if (yaExiste) {
        return items.map(item =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...items, { producto, cantidad: 1 }];
    });
  }

  // 2. Restar cantidad (Y si llega a 0, lo borra)
  restarCantidad(productoId: string | undefined) {
    const itemExistente = this.itemsSignal().find(item => item.producto.id === productoId);
    if (!itemExistente) return;

    if (itemExistente.cantidad > 1) {
      this.itemsSignal.update(items =>
        items.map(item => (item.producto.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item))
      );
    } else {
      this.eliminarDelCarrito(productoId);
    }
  }

  // 3. Eliminar el producto completo del carrito (El basurero)
  eliminarDelCarrito(productoId: string | undefined) {
    this.itemsSignal.update(items => items.filter(item => item.producto.id !== productoId));
  }

  // 4. Ver el carrito
  obtenerCarrito(): ItemCarrito[] {
    return this.itemsSignal();
  }

  // 5. Calcular el total
  obtenerTotal(): number {
    return this.totalSignal();
  }
}
