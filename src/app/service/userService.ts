// ── rendez-vous.service.ts ───────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class UserService {
    constructor(private readonly http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(`${BASE}/users`);
    }

    bloquer(id: number): Observable<void> {
        return this.http.patch<void>(`${BASE}/users/${id}/bloquer`, {});
    }

    activer(id: number): Observable<void> {
        return this.http.patch<void>(`${BASE}/users/${id}/activer`, {});
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${BASE}/users/${id}`);
    }
}