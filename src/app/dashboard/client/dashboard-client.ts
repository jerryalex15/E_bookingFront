import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../service/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RendezVousService } from '../../service/rendezVousService';
import { PrestataireService } from '../../service/prestataireService';
import { ServiceService } from '../../service/serviceService';
import { DisponibiliteResponse } from '../../model/interfaces';
import { UtcToLocalPipe } from '../../service/utc-to-local-pipe';

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    UtcToLocalPipe
  ],
  templateUrl: './dashboard-client.html',
  styleUrl: './../dashboard.scss',
})
export class DashboardClientComponent implements OnInit {
  activeSection: 'rdv' | 'nouveau-rdv' | 'prestataires' | 'services' = 'rdv';

  loading = false;
  rdvClient: any[] = [];
  prestataires: any[] = [];
  services: any[] = [];
  sectionTitle = '';
  sectionSub = '';

  disponibilites: DisponibiliteResponse[] = [];
  creneaux: string[] = []; // ex: ["09:00", "10:00", "11:00"]
  selectedCreneau: string | null = null;
  selectedDate: string = '';
  today: string = new Date().toISOString().split('T')[0];

  rdvForm!: FormGroup;
  currentUser: any;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly rdvService: RendezVousService,
    private readonly prestataireService: PrestataireService,
    private readonly serviceService: ServiceService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.getToken()) {
      this.router.navigate(['/login']);
      return;
    }

    this.rdvForm = this.fb.group({
      prestataireId: ['', Validators.required],
      dateHeure: ['', Validators.required],
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

      case 'nouveau-rdv':
        this.sectionTitle = 'Nouveau rendez-vous';
        this.sectionSub = 'Réservez un créneau';
        break;

      case 'prestataires':
        this.sectionTitle = 'Prestataires';
        this.sectionSub = 'Découvrez les professionnels';
        break;

      case 'services':
        this.sectionTitle = 'Services';
        this.sectionSub = 'Explorez les services disponibles';
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
        this.rdvService.getByClient(this.currentUser.userId).subscribe({
          next: (d) => {
            this.rdvClient = d;
            done();
          },
          error: fail,
        });
        break;
      case 'nouveau-rdv':
      case 'prestataires':
        this.prestataireService.getAll().subscribe({
          next: (d) => {
            this.prestataires = d;
            done();
          },
          error: fail,
        });
        break;
      case 'services':
        this.serviceService.getAll().subscribe({
          next: (d) => {
            this.services = d;
            done();
          },
          error: fail,
        });
        break;
      default:
        done();
    }
  }

  submitRdv(): void {
    if (this.rdvForm.invalid) return;
    this.loading = true;
    const payload = {
      userId: this.currentUser.userId,
      prestataireId: +this.rdvForm.value.prestataireId,
      dateHeure: this.rdvForm.value.dateHeure,
    };
    this.rdvService.create(payload).subscribe({
      next: () => {
        this.loading = false;
        this.rdvForm.reset();
        this.snackBar.open('Rendez-vous confirmé !', 'OK', { duration: 4000, panelClass: "snack-rdv-success" });
        this.setSection('rdv');
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message ?? 'Créneau indisponible', 'Fermer', {
          duration: 4000,
        });
      },
    });
  }

  deleteRdv(id: number): void {
    this.rdvService.delete(id).subscribe({
      next: () => {
        this.rdvClient = this.rdvClient.filter((r) => r.rendezVousId !== id);
        this.snackBar.open('Rendez-vous annulé', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  statusClass(statut: string): string {
    return statut === 'CONFIRME' ? 'confirmed' : statut === 'ANNULE' ? 'cancelled' : 'pending';
  }

  onPrestataireChange(prestataireIdRaw: any): void {
    // Conversion en nombre
    const prestataireId = Number(prestataireIdRaw);

    this.creneaux = [];
    this.selectedCreneau = null;
    this.selectedDate = '';

    if (prestataireId) {
      this.rdvService.getDisponibilites(prestataireId).subscribe({
        next: (data) => (this.disponibilites = data),
      });
    }
  }

  onDateChange(date: string): void {
    this.selectedDate = date;
    this.selectedCreneau = null;

    // On extrait le jour de la semaine en FRANÇAIS ('fr-FR')
    const jourEnFrancais = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' }); // Exemple : "lundi"
    const jourSemaine = jourEnFrancais.charAt(0).toUpperCase() + jourEnFrancais.slice(1); // on obtient Lundi
    const disposDuJour = this.disponibilites.filter((d) => d.jourSemaine === jourSemaine);

    this.creneaux = [];
    // Récupérer le décalage horaire de l'utilisateur en minutes
    // Exemple pour la France en mai (UTC+2) : getTimezoneOffset() renvoie -120.
    const userOffsetMinutes = -new Date().getTimezoneOffset(); // +120mn

    for (const dispo of disposDuJour) {
      // Extraction des heures et minutes UTC du back-end
      const [hUtc, mUtc] = dispo.heureDebut.split(':').map(Number);
      const [hFinUtc, mFinUtc] = dispo.heureFin.split(':').map(Number);

      // Conversion en minutes totales depuis minuit (en UTC)
      let totalMinutesDebut = hUtc * 60 + mUtc;
      const totalMinutesFin = hFinUtc * 60 + mFinUtc;

      // Application du décalage horaire local
      // Ex: 07:00 UTC -> 420 minutes + 120 minutes = 540 minutes (soit 09:00 local)
      let currentMinutesLocal = totalMinutesDebut + userOffsetMinutes;
      const endMinutesLocal = totalMinutesFin + userOffsetMinutes;

      // Génération des créneaux en heure locale
      while (currentMinutesLocal < endMinutesLocal) {
        // On recalcule l'heure et la minute pour l'affichage
        const hLocal = Math.floor(currentMinutesLocal / 60) % 24;
        const mLocal = currentMinutesLocal % 60;

        this.creneaux.push(
          `${String(hLocal).padStart(2, '0')}:${String(mLocal).padStart(2, '0')}`
        );
        // Avancer de 60 minutes pour le prochain créneau (modifiez à 30 si besoin)
        currentMinutesLocal += 60;
      }
    }
  }

  selectCreneau(heure: string): void {
    // Si le créneau cliqué est déjà celui sélectionné, on le désélectionne
    if (this.selectedCreneau === heure) {
      this.selectedCreneau = null;
      this.rdvForm.patchValue({ dateHeure: null }); // On vide le contrôle du formulaire
      return;
    }

    // Sinon
    this.selectedCreneau = heure;
    
    const localDateTime = `${this.selectedDate}T${heure}`; // Ex: "2026-05-20T07:00"
    const dateHeureZone = this.toZonedString(localDateTime);
    
    this.rdvForm.patchValue({ dateHeure: dateHeureZone });
  }

  addOneHour(heure: string): string {
    const [h, m] = heure.split(':').map(Number);
    return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private toZonedString(localDateTime: string) {
    const date = new Date(localDateTime);
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
    return `${localDateTime}:00${sign}${pad(offset / 60)}:${pad(offset % 60)}`;
  }
}
