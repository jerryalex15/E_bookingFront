// ── rendez-vous.service.ts ───────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DisponibiliteResponse } from '../model/interfaces';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ServiceService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE}/services`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(`${BASE}/services`, payload);
  }

  update(id: number, data: { nomService: string; description: string }): Observable<any> {
    return this.http.put<any>(`${BASE}/services/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/services/${id}`);
  }
}
