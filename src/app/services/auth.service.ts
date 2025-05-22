import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private checkTokenValidity(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Get token expiration from payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
          // Check if token is expired
          const expiryTime = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          if (now >= expiryTime) {
            // Token expired, log user out
            console.log('Token expired');
            this.logout();
            this.router.navigate(['/login']);
            return;
          }
        }
      } catch (e) {
        console.error('Error parsing token:', e);
        this.logout();
      }
    }
  }

  constructor(private router: Router) {
    // Check token validity when service initializes
    this.checkTokenValidity();
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  public get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  login(token: string): void {
    localStorage.setItem('token', token);
    this.isLoggedInSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.isLoggedInSubject.next(false);
  }
}