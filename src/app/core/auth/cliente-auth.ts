import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente } from '../../shared/models/cliente.model';

const CLAVE_TOKEN = 'luloapp_cliente_token';
const CLAVE_CLIENTE = 'luloapp_cliente_info';

interface ClienteAuthResponse {
  token: string;
  expiresAtUtc: string;
  cliente: Cliente;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteAuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly esNavegador = isPlatformBrowser(this.platformId);

  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  // localStorage (a diferencia del token de admin, que va en sessionStorage): un
  // cliente sí espera seguir con la sesión iniciada aunque cierre y reabra el navegador.
  private readonly tokenSignal = signal<string | null>(this.esNavegador ? localStorage.getItem(CLAVE_TOKEN) : null);
  private readonly clienteSignal = signal<Cliente | null>(this.leerClienteGuardado());

  readonly estaAutenticado = computed(() => this.tokenSignal() !== null);
  readonly cliente = this.clienteSignal.asReadonly();

  // Controla el popup de bienvenida desde cualquier punto de la app (auto al cargar,
  // o manualmente desde el dropdown de cuenta en el navbar).
  readonly mostrarPopup = signal(false);

  abrirPopup(): void {
    this.mostrarPopup.set(true);
  }

  cerrarPopup(): void {
    this.mostrarPopup.set(false);
  }

  async registrar(nombre: string, email: string, password: string): Promise<void> {
    const respuesta = await firstValueFrom(
      this.http.post<ClienteAuthResponse>(`${this.apiUrl}/registro`, { nombre, email, password })
    );
    this.guardarSesion(respuesta);
  }

  async login(email: string, password: string): Promise<void> {
    const respuesta = await firstValueFrom(
      this.http.post<ClienteAuthResponse>(`${this.apiUrl}/login`, { email, password })
    );
    this.guardarSesion(respuesta);
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.clienteSignal.set(null);
    if (this.esNavegador) {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_CLIENTE);
    }
  }

  obtenerToken(): string | null {
    return this.tokenSignal();
  }

  private guardarSesion(respuesta: ClienteAuthResponse): void {
    this.tokenSignal.set(respuesta.token);
    this.clienteSignal.set(respuesta.cliente);
    if (this.esNavegador) {
      localStorage.setItem(CLAVE_TOKEN, respuesta.token);
      localStorage.setItem(CLAVE_CLIENTE, JSON.stringify(respuesta.cliente));
    }
  }

  private leerClienteGuardado(): Cliente | null {
    if (!this.esNavegador) {
      return null;
    }
    const guardado = localStorage.getItem(CLAVE_CLIENTE);
    return guardado ? (JSON.parse(guardado) as Cliente) : null;
  }
}
