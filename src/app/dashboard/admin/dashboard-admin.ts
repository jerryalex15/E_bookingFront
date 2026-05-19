import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { StatistiquesService } from '../../service/statistiqueService';
import { ServiceService } from '../../service/serviceService';
import { PrestataireService } from '../../service/prestataireService';
import { UserService } from '../../service/userService';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DecimalPipe,
  ],
  templateUrl: './dashboard-admin.html',
  styleUrl: './../dashboard.scss',
})
export class DashboardAdminComponent implements OnInit {
  activeSection: 'stats' | 'users' | 'prestataires' | 'services' = 'stats';

  // a changer en interface tous ça
  loading = false;
  stats: any = null;
  users: any[] = [];
  prestataires: any[] = [];
  services: any[] = [];

  selectedService: any = null;

  serviceForm!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly prestataireService: PrestataireService,
    private readonly serviceService: ServiceService,
    private readonly statsService: StatistiquesService,
    private readonly snackBar: MatSnackBar,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  // ── Getters navigation ──────────────────────────────
  get sectionTitle(): string {
    const titles: Record<string, string> = {
      stats: 'Statistiques globales',
      users: 'Gestion des utilisateurs',
      prestataires: 'Gestion des prestataires',
      services: 'Gestion des services',
    };
    return titles[this.activeSection] ?? 'Tableau de bord';
  }

  get sectionSub(): string {
    const subs: Record<string, string> = {
      stats: "Vue d'ensemble de l'activité",
      users: 'Activez, bloquez ou supprimez des comptes',
      prestataires: 'Liste complète des prestataires',
      services: 'Créez et supprimez des services',
    };
    return subs[this.activeSection] ?? '';
  }

  ngOnInit(): void {

    if (!this.authService.getToken()){
      this.router.navigate(["/login"]);
      return;
    }
    
    this.serviceForm = this.fb.group({
      nomService: ['', Validators.required],
      description: [''],
    });
    this.route.queryParams.subscribe((params) => {
      const section = (params['section'] as typeof this.activeSection) ?? 'stats';
      this.activeSection = section;
      this.loadSection(section);
    });
  }

  setSection(s: typeof this.activeSection): void {
    this.activeSection = s;
    this.loadSection(s);
  }

  private loadSection(s: string): void {
    this.loading = true;
    const done = () => (this.loading = false);
    const fail = (err: any) => {
      this.loading = false;
      this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 4000 });
    };

    switch (s) {
      case 'stats':
        this.statsService.getStats().subscribe({
          next: (d) => {
            this.stats = d;
            done();
          },
          error: fail,
        });
        break;
      case 'users':
        this.userService.getAll().subscribe({
          next: (d) => {
            this.users = d;
            done();
          },
          error: fail,
        });
        break;
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

  bloquerUser(id: number): void {
    this.userService.bloquer(id).subscribe({
      next: () => {
        const u = this.users.find((x) => x.userId === id);
        if (u) u.activeStatut = false;
        this.snackBar.open('Compte bloqué', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  activerUser(id: number): void {
    this.userService.activer(id).subscribe({
      next: () => {
        const u = this.users.find((user) => user.userId === id);
        if (u) u.activeStatut = true;
        this.snackBar.open('Compte activé', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  deleteUser(id: number): void {
    this.userService.delete(id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.userId !== id);
        this.snackBar.open('Utilisateur supprimé', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  deletePrestataire(id: number): void {
    this.prestataireService.delete(id).subscribe({
      next: () => {
        this.prestataires = this.prestataires.filter((p) => p.prestataireId !== id);
        this.snackBar.open('Prestataire supprimé', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  createService(): void {
    if (this.serviceForm.invalid) return;
    this.serviceService.create(this.serviceForm.value).subscribe({
      next: (d) => {
        this.services = [...this.services, d];
        this.serviceForm.reset();
        this.snackBar.open('Service créé', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  selectForEdit(s: any): void { // a typer en service
    this.selectedService = s;
    this.serviceForm.patchValue({
      nomService: s.nomService,
      description: s.description,
    });
  }

  cancelEdit(): void {
    this.selectedService = null;
    this.serviceForm.reset();
  }

  updateService(): void {
    if (this.serviceForm.invalid || !this.selectedService) return;
    this.serviceService.update(this.selectedService.serviceId, this.serviceForm.value).subscribe({
      next: (updated) => {
        this.services = this.services.map(s =>
          s.serviceId === updated.serviceId ? updated : s
        );
        this.cancelEdit();
        this.snackBar.open('Service mis à jour', 'OK', { duration: 3000 });
      },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  deleteService(id: number): void {
    this.serviceService.delete(id).subscribe({
      next: () => {
        this.services = this.services.filter((s) => s.serviceId !== id);
        this.snackBar.open('Service supprimé', 'OK', { duration: 3000 });
      },
      error: (err) =>
        this.snackBar.open(err.error?.message ?? 'Erreur', 'Fermer', { duration: 3000 }),
    });
  }
}
