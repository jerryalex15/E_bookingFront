import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs';

export function roleGuard(requiredRole: 'CLIENT' | 'PRO' | 'ADMIN'): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.getCurrentUser().pipe(
      map((user) => {

        const roleNom = user?.role?.roleNom;
        if (roleNom === requiredRole) {
          return true;
        }
        // Redirige vers la bonne page selon le rôle réel
        if (roleNom == 'ADMIN') return router.createUrlTree(['/dashboard/admin']);
        if (roleNom ==='PRO') return router.createUrlTree(['/dashboard/pro']);
        return router.createUrlTree(['/dashboard/client']);
      }),
    );
  };
}
