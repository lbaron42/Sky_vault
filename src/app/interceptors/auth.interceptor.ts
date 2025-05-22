import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');
  
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Token expired or invalid
          console.log('Token expired or invalid, redirecting to login');
          // Clear token and update auth state
          authService.logout();
          // Show user-friendly message before redirect
          alert('Your session has expired or is invalid. Please log in again.');
          // Redirect to login
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  } else {
  // No token found
  // Only redirect if not accessing /login or /signup endpoints
  if (
    req.url.includes('/signup')
  ) {
    console.log('No token found, redirecting to login');
    router.navigate(['/login']);
  }
  return next(req);
  }
};