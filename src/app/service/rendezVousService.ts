import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class RendezVousService {
    constructor(private readonly http: HttpClient) { }

    getByClient(clientId: number): Observable<any[]> {
        return this.http.get<any[]>(`${BASE}/rendez-vous/client/${clientId}`);
    }

    getByPrestataire(prestataireId: number): Observable<any[]> {
        return this.http.get<any[]>(`${BASE}/rendez-vous/prestataire/${prestataireId}`);
    }

    create(payload: any): Observable<any> {
        return this.http.post<any>(`${BASE}/rendez-vous`, payload);
    }

    update(id: number, payload: any): Observable<any> {
        return this.http.patch<any>(`${BASE}/rendez-vous/${id}`, payload);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${BASE}/rendez-vous/${id}`);
    }

    getDisponibilites(prestataireId: number): Observable<any> {
        return this.http.get(`${BASE}/disponibilites/prestataire/${prestataireId}`);
    }
}