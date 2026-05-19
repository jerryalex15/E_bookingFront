import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, RouterLinkActive, RouterLink],
  templateUrl: './dashboard-shell.html',
  styleUrl: './../dashboard.scss',
})
export class DashboardShellComponent implements OnInit {
  user: any = null;
  role: 'CLIENT' | 'PRO' | 'ADMIN' = 'CLIENT';

  get isClient() {
    return this.role === 'CLIENT';
  }
  get isPro() {
    return this.role === 'PRO';
  }
  get isAdmin() {
    return this.role === 'ADMIN';
  }

  get roleLabel() {
    return this.isAdmin ? 'Admin' : this.isPro ? 'Professionnel' : 'Client';
  }
  get roleClass() {
    return this.isAdmin ? 'accent--admin' : this.isPro ? 'accent--pro' : 'accent--client';
  }
  get initials() {
    return ((this.user?.prenom?.[0] ?? '') + (this.user?.nom?.[0] ?? '')).toUpperCase();
  }

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        const roleNom = user?.role?.roleNom;
        this.role = roleNom === 'ADMIN' ? 'ADMIN' : roleNom === 'PRO' ? 'PRO' : 'CLIENT';
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
