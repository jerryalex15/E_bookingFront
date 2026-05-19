import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../service/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { RendezVousService } from '../../service/rendezVousService';
import { PrestataireService } from '../../service/prestataireService';
import { DisponibiliteService } from '../../service/disponibiliteService';
import { ServiceService } from '../../service/serviceService';
import { UtcToLocalPipe } from '../../service/utc-to-local-pipe';

@Component({
  selector: 'app-dashboard-pro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    UtcToLocalPipe
  ],
  templateUrl: './dashboard-pro.html',
  styleUrl: './../dashboard.scss',
})
export class DashboardProComponent implements OnInit {
  activeSection: 'rdv' | 'disponibilites' | 'profil' = 'rdv';

  loading = false;
  rdvPro: any[] = [];
  disponibilites: any[] = [];
  profilPrestataire: any = null;
  currentUser: any;
  sectionTitle = '';
  sectionSub = '';

  selectedDispoId: number | null = null;
  services: any[] = [];

  dispoForm!: FormGroup;
  profilForm!: FormGroup;

  get initials(): string {
    return (
      (this.currentUser?.prenom?.[0] ?? '') + (this.currentUser?.nom?.[0] ?? '')
    ).toUpperCase();
  }

  get currentServiceName(): string {
    return this.services.find(s => s.serviceId === this.profilPrestataire?.serviceId)?.nomService ?? '';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly rdvService: RendezVousService,
    private readonly prestataireService: PrestataireService,
    private readonly dispoService: DisponibiliteService,
    private readonly serviceService: ServiceService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {

    if (!this.authService.getToken()){
      this.router.navigate(["/login"]);
      return;
    }

    this.dispoForm = this.fb.group({
      dateHeureDebut: ['', Validators.required],
      dateHeureFin: ['', Validators.required],
    });
    this.profilForm = this.fb.group({
      specialite: ['', Validators.required],
      adresse: [''],
      serviceId: [null, Validators.required],
      userId: [null],
    });


    this.authService.getCurrentUser().subscribe((user) => {
      this.currentUser = user;
      this.route.queryParams.subscribe((params) => {
        const section = (params['section'] as typeof this.activeSection) ?? 'rdv';
        this.activeSection = section;
        this.updateHeader();
        this.loadSection(section);
      });
    });
  }

  setSection(s: typeof this.activeSection): void {
    this.activeSection = s;
    this.loadSection(s);
    this.updateHeader();
  }

  private updateHeader(): void {
    switch (this.activeSection) {
      case 'rdv':
        this.sectionTitle = 'Mes rendez-vous';
        this.sectionSub = 'Consultez et gérez vos RDV';
        break;

      case 'disponibilites':
        this.sectionTitle = 'Disponibilités';
        this.sectionSub = 'Gérez vos créneaux horaires';
        break;

      case 'profil':
        this.sectionTitle = 'Mon profil';
        this.sectionSub = 'Gérez vos informations professionnelles';
        break;
    }
  }

  private loadSection(s: string): void {
    this.loading = true;
    const done = () => (this.loading = false);
    const fail = (err: any) => {
      this.loading = false;
      this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 4000 });
    };

    switch (s) {
      case 'rdv':
        this.rdvService.getByPrestataire(this.currentUser.prestataireId).subscribe({
          next: (d) => {
            this.rdvPro = d;
            done();
          },
          error: fail,
        });
        break;
      case 'disponibilites':
        this.dispoService.getByPrestataire(this.currentUser.prestataireId).subscribe({
          next: (d) => {
            this.disponibilites = d;
            done();
          },
          error: fail,
        });
        break;
      case 'profil':
        this.prestataireService.getById(this.currentUser.prestataireId).subscribe({
          next: (d) => {
            this.profilPrestataire = d;

            this.serviceService.getAll().subscribe({
              next: (services) => {
                this.services = services;
                this.profilForm.patchValue({
                  specialite: d.specialite,
                  adresse: d.adresse,
                  serviceId: d.serviceId ?? null,
                  userId: this.currentUser.userId,
                });
                done();
              },
              error: fail,
            });
          },
          error: fail,
        });
        break;
      default:
        done();
    }
  }

  confirmerRdv(id: number): void {
    this.rdvService.update(id, { statut: 'CONFIRME' }).subscribe({
      next: (updated) => {
        const idx = this.rdvPro.findIndex((r) => r.rendezVousId === id);
        if (idx >= 0) this.rdvPro[idx] = updated;
        this.snackBar.open('Rendez-vous confirmé', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  annulerRdv(id: number): void {
    this.rdvService.update(id, { statut: 'ANNULE' }).subscribe({
      next: (updated) => {
        const idx = this.rdvPro.findIndex((r) => r.rendezVousId === id);
        if (idx >= 0) this.rdvPro[idx] = updated;
        this.snackBar.open('Rendez-vous annulé', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }
  /** Pour avoir une date et heure avec le time zone ex: +02:00 pour France */
  private toZonedString(localDateTime: string) {
    const date = new Date(localDateTime);
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    return `${localDateTime}:00${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
  }

  editDispo(d: any): void {
    this.selectedDispoId = d.disponibiliteId;
    this.dispoForm.setValue({
      dateHeureDebut: this.toLocalDateTimeString(d.date, d.heureDebut),
      dateHeureFin: this.toLocalDateTimeString(d.date, d.heureFin),
    });
  }

  cancelEdit(): void {
    this.selectedDispoId = null;
    this.dispoForm.reset();
  }

  // Convertit "2026-05-20" + "09:00:00" -> "2026-05-20T09:00"
  toLocalDateTimeString(date: string, heure: string): string {
    // Reconstitue un instant UTC complet
    const utcString = `${date}T${heure.substring(0, 8)}Z`;
    const localDate = new Date(utcString);

    // Formate en "YYYY-MM-DDTHH:mm" dans la timezone locale du navigateur
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}` +
      `T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`
    );
  }

  toLocalTimeDisplay(date: string, heure: string): string {
    const utcString = `${date}T${heure.substring(0, 8)}Z`;
    const localDate = new Date(utcString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;
  }

  submitDispo(): void {
    if (this.dispoForm.invalid) return;
    this.loading = true;
    const payload = {
      prestataireId: this.currentUser.prestataireId,
      dateHeureDebut: this.toZonedString(this.dispoForm.value.dateHeureDebut),
      dateHeureFin: this.toZonedString(this.dispoForm.value.dateHeureFin),
    };

    const request$ = this.selectedDispoId
      ? this.dispoService.update(this.selectedDispoId, payload)
      : this.dispoService.create(payload);

    request$.subscribe({
      next: (dispo) => {
        this.loading = false;
        if (this.selectedDispoId) {
          this.disponibilites = this.disponibilites.map((d) =>
            d.disponibiliteId === this.selectedDispoId ? dispo : d,
          );
          this.snackBar.open('Disponibilité mise à jour', 'OK', { duration: 3000 });
        } else {
          this.disponibilites = [...this.disponibilites, dispo];
          this.snackBar.open('Disponibilité ajoutée', 'OK', { duration: 3000 });
        }
        this.selectedDispoId = null;
        this.dispoForm.reset();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message ?? 'Conflit de créneau', 'Fermer', {
          duration: 4000,
        });
      },
    });
  }

  deleteDispo(id: number): void {
    this.dispoService.delete(id).subscribe({
      next: () => {
        this.disponibilites = this.disponibilites.filter((d) => d.disponibiliteId !== id);
        this.snackBar.open('Disponibilité supprimée', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  updateProfil(): void {
    if (!this.profilPrestataire) return;
    this.prestataireService
      .update(this.profilPrestataire.prestataireId, this.profilForm.value)
      .subscribe({
        next: (d) => {
          this.profilPrestataire = d;
          this.snackBar.open('Profil mis à jour', 'OK', { duration: 3000 });
        },
        error: (err) =>
          this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
      });
  }

  statusClass(statut: string): string {
    return statut === 'CONFIRME' ? 'confirmed' : statut === 'ANNULE' ? 'cancelled' : 'pending';
  }
}
