// ── rendez-vous.service.ts ───────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class DisponibiliteService {
    constructor(private readonly http: HttpClient) { }

    getByPrestataire(prestataireId: number): Observable<any[]> {
        return this.http.get<any[]>(`${BASE}/disponibilites/prestataire/${prestataireId}`);
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(`${BASE}/disponibilites`, payload);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${BASE}/disponibilites/${id}`);
    }

    update(id: number, payload: any): Observable<any> {
        return this.http.put(`${BASE}/disponibilites/${id}`, payload);
    }
}