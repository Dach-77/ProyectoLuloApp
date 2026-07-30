import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const CLAVE_TOKEN = 'luloapp_token';

interface LoginResponse {
  token: string;
  expiresAtUtc: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly esNavegador = isPlatformBrowser(this.platformId);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // sessionStorage no existe durante el renderizado en servidor (SSR): el signal
  // arranca en null ahí, y solo se hidrata desde storage cuando corre en el navegador.
  private readonly tokenSignal = signal<string | null>(this.esNavegador ? sessionStorage.getItem(CLAVE_TOKEN) : null);

  readonly estaAutenticado = computed(() => this.tokenSignal() !== null);

  async login(usuario: string, contrasena: string): Promise<void> {
    const respuesta = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username: usuario, password: contrasena })
    );

    this.tokenSignal.set(respuesta.token);
    if (this.esNavegador) {
      sessionStorage.setItem(CLAVE_TOKEN, respuesta.token);
    }
  }

  logout(): void {
    this.tokenSignal.set(null);
    if (this.esNavegador) {
      sessionStorage.removeItem(CLAVE_TOKEN);
    }
  }

  obtenerToken(): string | null {
    return this.tokenSignal();
  }
}
