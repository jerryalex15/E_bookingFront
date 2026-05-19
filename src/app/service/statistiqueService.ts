// ── rendez-vous.service.ts ───────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class StatistiquesService {
    constructor(private readonly http: HttpClient) { }

    getStats(): Observable<any> {
        return this.http.get<any>(`${BASE}/statistiques`);
    }
}