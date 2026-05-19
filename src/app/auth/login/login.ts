import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../service/auth.service';
import { AuthResponse } from '../../model/interfaces';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.authService.login(this.form.value).subscribe({
      next: (response: AuthResponse) => {
        this.loading = false;
        localStorage.setItem('token', response.token);
        this.authService.fetchCurrentUser().subscribe((user) => {
          const role = user?.role?.roleNom;
          if (role === 'ADMIN') this.router.navigate(['/dashboard/admin']);
          else if (role === 'PRO') this.router.navigate(['/dashboard/pro']);
          else this.router.navigate(['/dashboard/client']);
        });
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Une erreur est survenue lors de la connexion.';
        this.snackBar.open(msg, 'Fermer', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }
}
