import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto, StockItem } from '../../../../shared/models/producto.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css'
})
export class ProductoForm implements OnChanges {
  @Input() productoEditado: Producto | null = null;

  @Output() guardar = new EventEmitter<{ producto: Producto; archivosPorColor: Record<string, File> }>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() eliminar = new EventEmitter<void>();

  nuevoProducto: Producto = this.productoVacio();

  // No hay una foto "principal" por separado: cada color se sube por su cuenta (color
  // -> archivo elegido en este guardado) y la primera se usa como portada del producto.
  archivosPorColor: Record<string, File> = {};

  // Opciones fijas para los botones de selección (Materiales/Temporadas/Tallas/Colores/Género)
  readonly generoOpciones = ['Niño', 'Niña', 'Unisex'];
  readonly materialesOpciones = ['Algodón', 'Lino', 'Lana', 'Poliéster', 'Denim', 'Seda'];
  readonly temporadasOpciones = ['Verano', 'Invierno', 'Primavera', 'Otoño'];
  readonly tallasOpciones = ['S', 'M', 'L', 'XL', 'Única'];
  readonly coloresOpciones = [
    'Blanco', 'Negro', 'Gris', 'Beige', 'Crema', 'Azul', 'Azul Claro', 'Azul Oscuro',
    'Rojo', 'Verde', 'Amarillo', 'Rosa', 'Pastel', 'Multicolor'
  ];

  get idEnEdicion(): string | null {
    return this.productoEditado?.id ?? null;
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('productoEditado' in changes) {
      const producto = this.productoEditado;
      this.nuevoProducto = producto
        ? {
            ...producto,
            tallas: [...producto.tallas],
            colores: [...producto.colores],
            materiales: [...producto.materiales],
            temporadas: [...producto.temporadas],
            stock: producto.stock.map(s => ({ ...s })),
            imagenesPorColor: producto.imagenesPorColor.map(i => ({ ...i }))
          }
        : this.productoVacio();
      this.archivosPorColor = {};
    }
  }

  // Llamado por el componente padre después de un guardar/eliminar exitoso, para
  // limpiar el formulario incluso cuando @Input productoEditado ya era null (crear
  // otra prenda nueva después de registrar la anterior).
  resetFormulario() {
    this.nuevoProducto = this.productoVacio();
    this.archivosPorColor = {};
  }

  private productoVacio(): Producto {
    return {
      nombre: '', codigo: '', activo: true, genero: 'Unisex',
      materiales: [], temporadas: [], tallas: [], colores: [], stock: [],
      precio: 0, imagenUrl: '', descripcion: '', imagenesPorColor: []
    };
  }

  // Foto para un color puntual: si no se sube ninguna, el catálogo muestra la portada
  // del producto cuando el cliente elija ese color.
  seleccionarImagenColor(event: Event, color: string) {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (archivo) {
      this.archivosPorColor[color] = archivo;
    } else {
      delete this.archivosPorColor[color];
    }
  }

  imagenActualDeColor(color: string): string | null {
    return this.nuevoProducto.imagenesPorColor.find(i => i.color === color)?.imagenUrl ?? null;
  }

  // --- Materiales / Temporadas / Tallas / Colores (botones tipo checkbox) ---

  // Un solo método reutilizado por los 4 grupos: agrega o quita el valor de la lista
  // sin afectar los demás valores ya elegidos (a diferencia de un <select multiple>
  // nativo, donde hacer clic sin mantener Ctrl deselecciona todo lo demás).
  toggleValor(lista: string[], valor: string) {
    const indice = lista.indexOf(valor);
    if (indice >= 0) {
      lista.splice(indice, 1);
    } else {
      lista.push(valor);
    }
  }

  // --- Stock por talla y color ---

  obtenerCantidad(talla: string, color: string): number {
    const item = this.nuevoProducto.stock.find(s => s.talla === talla && s.color === color);
    return item ? item.cantidad : 0;
  }

  actualizarCantidad(talla: string, color: string, valorCrudo: string) {
    const cantidad = Math.max(0, Number(valorCrudo) || 0);
    const item = this.nuevoProducto.stock.find(s => s.talla === talla && s.color === color);
    if (item) {
      item.cantidad = cantidad;
    } else {
      this.nuevoProducto.stock.push({ talla, color, cantidad });
    }
  }

  incrementarCantidad(talla: string, color: string) {
    this.actualizarCantidad(talla, color, String(this.obtenerCantidad(talla, color) + 1));
  }

  decrementarCantidad(talla: string, color: string) {
    this.actualizarCantidad(talla, color, String(this.obtenerCantidad(talla, color) - 1));
  }

  // Antes de guardar, descartamos combinaciones cuya talla o color ya no esté seleccionada
  private stockVigente(): StockItem[] {
    return this.nuevoProducto.stock.filter(s =>
      this.nuevoProducto.tallas.includes(s.talla) && this.nuevoProducto.colores.includes(s.color)
    );
  }

  // Si se subió una foto para un color y luego se deseleccionó ese color, no tiene
  // sentido seguir enviándola.
  private archivosPorColorVigentes(): Record<string, File> {
    return Object.fromEntries(
      Object.entries(this.archivosPorColor).filter(([color]) => this.nuevoProducto.colores.includes(color))
    );
  }

  onGuardar() {
    const fotosPorColor = this.archivosPorColorVigentes();

    // Al crear una prenda nueva se necesita al menos una foto (de algún color) para
    // tener una portada; al editar, se puede conservar la que ya tenía.
    if (!this.idEnEdicion && Object.keys(fotosPorColor).length === 0) {
      alert('Sube al menos una foto de color antes de guardar 📸');
      return;
    }

    this.nuevoProducto.stock = this.stockVigente();
    this.guardar.emit({
      producto: this.nuevoProducto,
      archivosPorColor: fotosPorColor
    });
  }

  onCancelar() {
    this.cancelar.emit();
  }

  onEliminar() {
    if (!this.idEnEdicion) return;

    const confirmado = confirm(`¿Seguro que quieres eliminar "${this.nuevoProducto.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    this.eliminar.emit();
  }
}
