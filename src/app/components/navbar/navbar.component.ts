import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { WarningService } from '../../services/warning.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  userName: string | undefined;
  isDashboardRoute: boolean = false;
  showDashboardTooltip: boolean = false;
  dropdownOpen = false;

  languages = [
    { code: 'en', label: 'English', flag: 'images/languages/US_3D1.png' },
    { code: 'pt', label: 'Português', flag: 'images/languages/BR_3D2.png' },
  ];
  currentLang: string = 'en'; // or your default

  // Always returns the flag for the current language
  get currentLangFlag(): string {
    const lang = this.languages.find((l) => l.code === this.currentLang);
    return lang ? lang.flag : '';
  }

  get currentLangLabel(): string {
    const lang = this.languages.find((l) => l.code === this.currentLang);
    return lang ? lang.label : 'Select Language';
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectLanguage(langCode: string) {
    this.switchLanguage(langCode);
    this.dropdownOpen = false;
  }

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private router: Router,
    private warningService: WarningService,
    private translate: TranslateService
  ) {
    // Listen to route changes
    this.router.events.subscribe(() => {
      this.isDashboardRoute = this.router.url === '/dashboard';
    });
    this.currentLang =
      this.translate.currentLang || this.translate.getDefaultLang();
  }

  ngOnInit(): void {
    this.userService.currentUser$.subscribe((user) => {
      this.userName = user?.name;
    });
    this.userService.loadSavedUser();
    // Set initial route state
    this.isDashboardRoute = this.router.url === '/dashboard';
  }

  logout(): void {
    this.authService.logout();
    this.userService.setCurrentUser(null);
    this.router.navigate(['/login']);
  }

  handleDashboardClick(event: Event): void {
    if (this.isDashboardRoute) {
      event.preventDefault();
      this.showDashboardTooltip = true;
      setTimeout(() => {
        this.showDashboardTooltip = false;
      }, 2000);
    }
  }

  handleLogoClick(event: Event): void {
    if (this.isDashboardRoute) {
      event.preventDefault();
      this.warningService.show(this.translate.instant('NAVBAR.ALREADY_ON_DASHBOARD'), 'INFO');
    }
  }

  onDashboardMouseEnter() {
    if (this.isDashboardRoute) {
      this.showDashboardTooltip = true;
    }
  }

  onDashboardMouseLeave() {
    this.showDashboardTooltip = false;
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    this.currentLang = lang;
  }
}
