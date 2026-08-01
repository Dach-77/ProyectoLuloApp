import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Producto } from '../models/producto.model';

const CLAVE_CARRITO = 'luloapp_carrito';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  // Tope de unidades para esta variante puntual (talla+color), tomado del stock
  // real al momento de agregarla. Sin esto, ni el botón "+" del carrito ni repetir
  // "Comprar" tenían ningún límite: se podían pedir más unidades de las que existen.
  stockDisponible: number;
  // El id real del producto (el sintético "id-talla-color" de `producto.id` solo sirve
  // para deduplicar líneas del carrito) + la variante elegida. El checkout los necesita
  // tal cual para armar el pedido; sin esto habría que parsear el id sintético de vuelta.
  productoId: string;
  talla: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly esNavegador = isPlatformBrowser(this.platformId);

  // Signal en vez de un arreglo mutable plano: esta app no carga zone.js, así que
  // mutar un arreglo normal (this.items.push(...)) no le avisa a Angular que debe
  // volver a renderizar OTROS componentes (ej. el total en el navbar) cuando el
  // carrito cambia desde una tarjeta de producto. Con signal(), cada .update()
  // notifica automáticamente a cualquier vista que haya leído el valor.
  private readonly itemsSignal = signal<ItemCarrito[]>(this.esNavegador ? this.leerCarritoGuardado() : []);

  private readonly totalSignal = computed(() =>
    this.itemsSignal().reduce((total, item) => total + (item.producto.precio * item.cantidad), 0)
  );

  // Construye la variante talla+color de un producto y la agrega al carrito. Usado tanto
  // desde el modal de vista rápida del catálogo como desde cada tarjeta de producto, para
  // no duplicar la misma lógica de armado de variante en dos componentes distintos.
  // Devuelve false si esa combinación no tiene stock, para que el llamador pueda avisarle
  // al usuario en vez de agregar silenciosamente una prenda que no existe en inventario.
  agregarVarianteAlCarrito(producto: Producto, talla: string, color: string): boolean {
    const stockDisponible = producto.stock.find(s => s.talla === talla && s.color === color)?.cantidad ?? 0;
    if (stockDisponible <= 0) {
      return false;
    }

    const productoConVariante: Producto = {
      ...producto,
      id: `${producto.id}-${talla}-${color}`,
      nombre: `${producto.nombre} (Talla ${talla}, ${color})`
    };
    return this.agregarAlCarrito(productoConVariante, stockDisponible, { productoId: producto.id!, talla, color });
  }

  // 1. Agregar o sumar cantidad (respetando el stock disponible de la variante).
  // stockDisponible/variante solo se usan para dar de alta un item nuevo: si ya existe
  // en el carrito, se respeta el tope y la variante que ya tenía registrados desde que
  // se agregó por primera vez (por eso el botón "+" del navbar puede seguir llamando a
  // este método con solo el producto, sin repetir la variante).
  agregarAlCarrito(producto: Producto, stockDisponible = Infinity, variante?: { productoId: string; talla: string; color: string }): boolean {
    let agregado = false;

    this.actualizarItems(items => {
      const existente = items.find(item => item.producto.id === producto.id);

      if (existente) {
        if (existente.cantidad >= existente.stockDisponible) {
          return items;
        }
        agregado = true;
        return items.map(item =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }

      if (stockDisponible <= 0) {
        return items;
      }
      agregado = true;
      return [...items, {
        producto,
        cantidad: 1,
        stockDisponible,
        productoId: variante?.productoId ?? producto.id ?? '',
        talla: variante?.talla ?? '',
        color: variante?.color ?? ''
      }];
    });

    return agregado;
  }

  // 2. Restar cantidad (Y si llega a 0, lo borra)
  restarCantidad(productoId: string | undefined) {
    const itemExistente = this.itemsSignal().find(item => item.producto.id === productoId);
    if (!itemExistente) return;

    if (itemExistente.cantidad > 1) {
      this.actualizarItems(items =>
        items.map(item => (item.producto.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item))
      );
    } else {
      this.eliminarDelCarrito(productoId);
    }
  }

  // 3. Eliminar el producto completo del carrito (El basurero)
  eliminarDelCarrito(productoId: string | undefined) {
    this.actualizarItems(items => items.filter(item => item.producto.id !== productoId));
  }

  // 4. Ver el carrito
  obtenerCarrito(): ItemCarrito[] {
    return this.itemsSignal();
  }

  // 5. Calcular el total
  obtenerTotal(): number {
    return this.totalSignal();
  }

  // 6. Vaciar el carrito por completo (tras un checkout exitoso)
  vaciarCarrito() {
    this.actualizarItems(() => []);
  }

  private actualizarItems(fn: (items: ItemCarrito[]) => ItemCarrito[]) {
    this.itemsSignal.update(fn);
    if (this.esNavegador) {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(this.itemsSignal()));
    }
  }

  private leerCarritoGuardado(): ItemCarrito[] {
    try {
      const guardado = localStorage.getItem(CLAVE_CARRITO);
      return guardado ? (JSON.parse(guardado) as ItemCarrito[]) : [];
    } catch {
      return [];
    }
  }
}
