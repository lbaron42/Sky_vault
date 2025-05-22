import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { WarningService } from '../../services/warning.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, CommonModule, TranslateModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
  standalone: true,
})
export class SignUpComponent {
  // Properties to store form data
  userData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  passwordsMatch = true;
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private warningService: WarningService,
    private translate: TranslateService
  ) {}

  checkPasswordsMatch() {
    this.passwordsMatch =
      this.userData.password === this.userData.confirmPassword;
    return this.passwordsMatch;
  }

  onSubmit() {
    this.isLoading = true;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.userData.email)) {
      this.warningService.show(
        this.translate.instant('SIGNUP.EMAIL_NOT_VALID'),
        'ERROR'
      );
      this.isLoading = false;
      return;
    }

    this.checkPasswordsMatch();

    if (!this.passwordsMatch) {
      this.warningService.show(
        this.translate.instant('SIGNUP.PASSWORDS_NO_MATCH'),
        'ERROR'
      );
      this.isLoading = false;
      return;
    }

    const signupData = {
      name: this.userData.name,
      email: this.userData.email,
      password: this.userData.password,
    };

    this.apiService.signup(signupData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.warningService.show(
          this.translate.instant('SIGNUP.SUCCESS'),
          'INFO'
        );
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Signup failed:', error);

        if (
          error.status === 400 &&
          error.error.message === 'User already exists'
        ) {
          this.warningService.show(
            this.translate.instant('SIGNUP.USER_EXISTS'),
            'ERROR'
          );
        } else {
          this.warningService.show(
            this.translate.instant('SIGNUP.FAILED', {
              error: error.error.message || 'Unknown error',
            }),
            'ERROR'
          );
        }
      },
    });
  }
}
