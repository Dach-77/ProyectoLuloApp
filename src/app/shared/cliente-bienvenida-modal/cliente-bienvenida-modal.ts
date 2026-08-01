import { AfterViewInit, Component, ElementRef, ViewChild, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteAuthService } from '../../core/auth/cliente-auth';

// bootstrap.bundle.min.js se carga como script global (angular.json), no como
// módulo ES: no hay de dónde importar el tipo, así que se declara el global suelto.
declare const bootstrap: any;

const CLAVE_POPUP_VISTO = 'luloapp_popup_bienvenida_visto';

@Component({
  selector: 'app-cliente-bienvenida-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-bienvenida-modal.html',
})
export class ClienteBienvenidaModal implements AfterViewInit {
  @ViewChild('modalBienvenida') private readonly modalRef!: ElementRef<HTMLDivElement>;

  private readonly clienteAuthService = inject(ClienteAuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly esNavegador = isPlatformBrowser(this.platformId);

  private modalInstancia: any;

  readonly pestana = signal<'login' | 'registro'>('login');
  readonly cargando = signal(false);
  readonly mensajeError = signal<string | null>(null);

  emailLogin = '';
  passwordLogin = '';

  nombreRegistro = '';
  emailRegistro = '';
  passwordRegistro = '';
  confirmarPasswordRegistro = '';

  constructor() {
    // El popup se abre/cierra desde cualquier parte de la app (navbar, auto-apertura
    // al cargar) a través de este signal compartido en ClienteAuthService.
    effect(() => {
      const mostrar = this.clienteAuthService.mostrarPopup();
      if (!this.modalInstancia) {
        return;
      }
      if (mostrar) {
        this.pestana.set('login');
        this.mensajeError.set(null);
        this.modalInstancia.show();
      } else {
        this.modalInstancia.hide();
      }
    });
  }

  ngAfterViewInit(): void {
    // El global "bootstrap" solo existe cuando angular.json cargó su script (la app
    // real); en pruebas unitarias (Vitest/Karma) no está disponible.
    if (!this.esNavegador || typeof bootstrap === 'undefined') {
      return;
    }

    this.modalInstancia = new bootstrap.Modal(this.modalRef.nativeElement);
    this.modalRef.nativeElement.addEventListener('hidden.bs.modal', () => this.clienteAuthService.cerrarPopup());

    // Sugerir registro/login una sola vez por sesión de navegador, y solo si
    // todavía no hay una cuenta con sesión iniciada.
    const yaVisto = sessionStorage.getItem(CLAVE_POPUP_VISTO);
    if (!yaVisto && !this.clienteAuthService.estaAutenticado()) {
      setTimeout(() => {
        sessionStorage.setItem(CLAVE_POPUP_VISTO, '1');
        this.clienteAuthService.abrirPopup();
      }, 1500);
    }
  }

  cambiarPestana(pestana: 'login' | 'registro'): void {
    this.pestana.set(pestana);
    this.mensajeError.set(null);
  }

  cerrar(): void {
    this.clienteAuthService.cerrarPopup();
  }

  async onLogin(): Promise<void> {
    this.mensajeError.set(null);
    this.cargando.set(true);
    try {
      await this.clienteAuthService.login(this.emailLogin, this.passwordLogin);
      this.cerrar();
    } catch (error) {
      this.mensajeError.set(this.extraerMensajeError(error, 'Correo o contraseña incorrectos.'));
    } finally {
      this.cargando.set(false);
    }
  }

  async onRegistro(): Promise<void> {
    this.mensajeError.set(null);

    if (this.passwordRegistro.length < 8) {
      this.mensajeError.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (this.passwordRegistro !== this.confirmarPasswordRegistro) {
      this.mensajeError.set('Las contraseñas no coinciden.');
      return;
    }

    this.cargando.set(true);
    try {
      await this.clienteAuthService.registrar(this.nombreRegistro, this.emailRegistro, this.passwordRegistro);
      this.cerrar();
    } catch (error) {
      this.mensajeError.set(this.extraerMensajeError(error, 'No se pudo crear la cuenta.'));
    } finally {
      this.cargando.set(false);
    }
  }

  private extraerMensajeError(error: unknown, fallback: string): string {
    const httpError = error as { status?: number; error?: { error?: string } };
    if (httpError?.status === 429) {
      return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
    }
    return httpError?.error?.error ?? fallback;
  }
}
