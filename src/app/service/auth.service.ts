import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { AuthResponse, LoginRequest, ROLE_IDS, UserRequestDto } from '../model/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly BASE_URL = 'http://localhost:8080';

  private readonly currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private readonly http: HttpClient) {}

  registerClient(data: Omit<UserRequestDto, 'roleIds'>): Observable<any> {
    const payload: UserRequestDto = { ...data, roleIds: [ROLE_IDS.CLIENT] };
    return this.http.post(`${this.BASE_URL}/api/users/registration/client`, payload);
  }

  registerPro(data: Omit<UserRequestDto, 'roleIds'>): Observable<any> {
    const payload: UserRequestDto = { ...data, roleIds: [ROLE_IDS.PRO] };
    return this.http.post(`${this.BASE_URL}/api/users/registration/pro`, payload);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE_URL}/login`, credentials).pipe(
      tap((res) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          if (res.roles) {
            localStorage.setItem('roles', JSON.stringify(res.roles));
          }
        }
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRoles(): string[] {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  }

  fetchCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/api/auth/me`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
      }),
    );
  }

  getCurrentUser(): Observable<any> {
    // Si on a déjà l'utilisateur en mémoire (cache), on le renvoie directement
    if (this.currentUserSubject.value) {
      return of(this.currentUserSubject.value);
    }

    // Si on n'a pas l'utilisateur mais qu'on a un token, on va le chercher sur le Back
    const token = localStorage.getItem('token');
    if (token) {
      return this.fetchCurrentUser();
    }

    // Aucun utilisateur connecté
    return of(null);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    this.currentUserSubject.next(null);
  }
}
