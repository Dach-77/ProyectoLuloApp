import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../../shared/services/producto';
import { Producto } from '../../../shared/models/producto.model';
import { Observable, Subject, startWith, switchMap } from 'rxjs';
import { ProductoForm } from './producto-form/producto-form';
import { InventarioTabla } from './inventario-tabla/inventario-tabla';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ProductoForm, InventarioTabla],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private readonly productoService = inject(ProductoService);

  // Un Subject como disparador de recarga (en vez de reasignar productos$ a un
  // Observable nuevo cada vez) para que el AsyncPipe del template siga funcionando
  // sin depender de que Angular note el cambio de referencia — esta app no carga
  // zone.js, así que reasignar productos$ después de un await (guardar/eliminar/
  // cambiarEstado) nunca disparaba un nuevo render. Con switchMap sobre el mismo
  // Observable, el AsyncPipe se entera directo de cada nueva emisión.
  private readonly recargar$ = new Subject<void>();

  readonly productos$: Observable<Producto[]> = this.recargar$.pipe(
    startWith(undefined),
    switchMap(() => this.productoService.obtenerProductos(true)) // El panel de admin siempre ve el inventario completo (activos e inactivos)
  );

  // Si no es null, el formulario está editando esa prenda en vez de crear una nueva
  productoEnEdicion: Producto | null = null;

  @ViewChild(ProductoForm) private readonly productoForm!: ProductoForm;
  @ViewChild('tabBtnCrear') private readonly tabBtnCrear!: ElementRef<HTMLButtonElement>;

  private cargarProductos() {
    this.recargar$.next();
  }

  editarProducto(producto: Producto) {
    this.productoEnEdicion = producto;
    // Salta a la pestaña de creación/edición para mostrar el formulario ya lleno
    this.tabBtnCrear.nativeElement.click();
  }

  cancelarEdicion() {
    this.productoEnEdicion = null;
    this.productoForm.resetFormulario();
  }

  async guardar(evento: { producto: Producto; archivo: File | null }) {
    try {
      if (this.productoEnEdicion?.id) {
        await this.productoService.actualizarProducto(this.productoEnEdicion.id, evento.producto, evento.archivo);
        alert('¡Prenda actualizada con éxito! ✏️');
      } else {
        await this.productoService.guardarProductoConImagen(evento.producto, evento.archivo!);
        alert('¡Prenda y foto guardadas con éxito! 🎉');
      }

      this.productoEnEdicion = null;
      this.productoForm.resetFormulario();
      this.cargarProductos();
    } catch (error) {
      alert('Hubo un error al guardar. Revisa la consola.');
      console.error(error);
    }
  }

  async eliminarProducto() {
    if (!this.productoEnEdicion?.id) return;

    try {
      await this.productoService.eliminarProducto(this.productoEnEdicion.id);
      alert('Producto eliminado. 🗑️');
      this.productoEnEdicion = null;
      this.productoForm.resetFormulario();
      this.cargarProductos();
    } catch (error) {
      alert('Hubo un error al eliminar. Revisa la consola.');
      console.error(error);
    }
  }

  async cambiarEstado(producto: Producto) {
    try {
      await this.productoService.cambiarEstado(producto.id!, !producto.activo);
      this.cargarProductos();
    } catch (error) {
      alert('Hubo un error al cambiar el estado. Revisa la consola.');
      console.error(error);
    }
  }
}
