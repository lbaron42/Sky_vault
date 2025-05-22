import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserService } from '../../services/user.service';
import { WarningService } from '../../services/warning.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: true,
})
export class LoginComponent {
  credentials = {
    email: '',
    password: '',
  };

  error = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private userService: UserService,
    private warningService: WarningService,
    private translate: TranslateService
  ) {}

  onSubmit(): void {
    this.apiService.login(this.credentials).subscribe({
      next: (response) => {
        // Store the token
        this.authService.login(response.token);
        console.log(response.user.id);
        // Store username for the current section
        this.userService.setCurrentUser({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
        });
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.error = error.error.message || 'Login failed';
        this.warningService.show(
          this.translate.instant('LOGIN.INVALID_CREDENTIALS'),
          'ERROR'
        );
        console.error('Login error:', error);
      },
    });
  }
}
