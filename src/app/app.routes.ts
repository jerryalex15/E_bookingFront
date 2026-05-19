import { Routes } from '@angular/router';
import { DashboardShellComponent } from './dashboard/shell/dashboard-shell';
import { DashboardClientComponent } from './dashboard/client/dashboard-client';
import { DashboardProComponent } from './dashboard/pro/dashboard-pro';
import { DashboardAdminComponent } from './dashboard/admin/dashboard-admin';
import { roleGuard } from './service/role.guard';
import { AuthGuard } from './service/auth.guard';

export const routes: Routes = [
  // Auth
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.LoginComponent),
  },
  {
    // :role = 'client' ou 'pro'
    path: 'register/:role',
    loadComponent: () => import('./auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'register',
    redirectTo: 'register/client',
    pathMatch: 'full',
  },

  {
    path: 'dashboard',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'client', component: DashboardClientComponent, canActivate: [roleGuard('CLIENT')] },
      { path: 'pro', component: DashboardProComponent, canActivate: [roleGuard('PRO')] },
      { path: 'admin', component: DashboardAdminComponent, canActivate: [roleGuard('ADMIN')] },
      { path: '**', redirectTo: 'login' },
    ],
  },
  { path: '**', redirectTo: 'login' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
