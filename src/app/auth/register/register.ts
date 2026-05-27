import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirm = true;
  private routeSub!: Subscription;

  /** class dynamique lu depuis l'URL */
  role: 'pro' | 'client' = 'client';

  get isPro(): boolean { return this.role === 'pro'; }

  get roleLabel(): string { return this.isPro ? 'Professionnel' : 'Client'; }
  get roleEmoji(): string { return this.isPro ? '💼' : '👤'; }
  get accentClass(): string { return this.isPro ? 'accent--pro' : 'accent--client'; }

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly snackBar: MatSnackBar
  ) {
    this.form = this.fb.group(
      {
        prenom:       ['', [Validators.required, Validators.minLength(2)]],
        nom:          ['', [Validators.required, Validators.minLength(2)]],
        email:        ['', [Validators.required, Validators.email]],
        motDePasse:   ['', [Validators.required, Validators.minLength(8)]],
        confirmation: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const param = params.get('role');
      this.role = param === 'pro' ? 'pro' : 'client';
      this.form.reset(); // reset le formulaire au changement de rôle
    });
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
  }

  private passwordMatchValidator(group: FormGroup): { mismatch: true } | null {
    const pwd = group.get('motDePasse')?.value;
    const conf = group.get('confirmation')?.value;
    return pwd === conf ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;

    const { confirmation, ...payload } = this.form.value;
    const register$ = this.isPro
      ? this.authService.registerPro(payload)
      : this.authService.registerClient(payload);

    register$.subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open(
          `Compte ${this.roleLabel} créé avec succès ! Connectez-vous.`,
          'OK',
          { duration: 4000000, panelClass: 'snack-success' }
        );
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Une erreur est survenue. Réessayez.'; // regarder le message d'erreur venant du back pour le test (errorResponse)
        this.snackBar.open(msg, 'Fermer', { duration: 400000, panelClass: 'snack-error' });
      },
    });
  }
}