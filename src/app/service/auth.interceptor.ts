import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const router = inject(Router);

  const publicUrls = ['/login','/register','/verifyEmail'];

  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  if (isPublicUrl) {
    return next(req);
  }

  const clonedReq = token
    ? req.clone({ setHeaders: { Authorization: `${token}` } })
    : req;

  return next(clonedReq).pipe(
    catchError((err) => {
      if (err.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
