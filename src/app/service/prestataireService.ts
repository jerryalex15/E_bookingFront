// ── rendez-vous.service.ts ───────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PrestataireService {
    constructor(private readonly http: HttpClient) { }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(`${BASE}/prestataires`);
    }

    getById(id: number): Observable<any> {
        return this.http.get<any>(`${BASE}/prestataires/${id}`);
    }

    update(id: number, payload: any): Observable<any> {
        return this.http.put<any>(`${BASE}/prestataires/${id}`, payload);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${BASE}/prestataires/${id}`);
    }
}