import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AddAircraftComponent } from './modals/add-aircraft/add-aircraft.component';
import { MenageResponsibleComponent } from './modals/menage-responsible/menage-responsible.component';
import { ApiService } from '../../services/api.service';
import { Aircraft } from '../../models/aircraft.model';
import { WarningService } from '../../services/warning.service';
import { WarningToastComponent } from '../../components/warning-toast/warning-toast.component';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AddAircraftComponent,
    MenageResponsibleComponent,
    WarningToastComponent,
    TranslateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  aircraftList: Aircraft[] = [];
  showAddAircraftModal = false;
  showMenageResponsibleModal = false;
  loading = true;
  error = '';
  selectedAircraftId?: number;
  toastMessage = '';
  showToast = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private warningService: WarningService,
    private translate: TranslateService
  ) {}

  async toAircraft(aircraftId?: number): Promise<void> {
    if (!aircraftId) return;
    const aircraft = this.aircraftList.find((a) => a.id === aircraftId);
    if (!aircraft) {
      this.warningService.show(
        this.translate.instant('DASHBOARD.AIRCRAFT_NOT_FOUND'),
        'ERROR'
      );
      return;
    }
    this.apiService.getAircraftResponsible(aircraftId).subscribe({
      next: (responsibles) => {
        if (
          responsibles &&
          Array.isArray(responsibles) &&
          responsibles.length > 0
        ) {
          this.error = '';
          localStorage.setItem('aircraft_registration', aircraft.registration);
          localStorage.setItem('aircraft_image_url', aircraft.image_url);
          this.router.navigate(['/aircraft', aircraft.id], {
            state: { image_url: aircraft.image_url },
          });
        } else {
          this.warningService.show(
            this.translate.instant('DASHBOARD.NO_RESPONSIBLE'),
            'WARN', 4000
          );
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.warningService.show(
            this.translate.instant('DASHBOARD.NO_RESPONSIBLE'),
            'WARN', 4000
          );
        } else {
          this.warningService.show(
            this.translate.instant('DASHBOARD.FAILED_CHECK_RESPONSIBLE'),
            'ERROR'
          );
        }
      },
    });
  }

  async deleteAircraft(aircraftId?: number): Promise<void> {
    if (confirm(this.translate.instant('DASHBOARD.CONFIRM_DELETE'))) {
      const confirmed = await this.warningService.confirm(
        this.translate.instant('DASHBOARD.CONFIRM_DELETE_FLIGHTS')
      );
      if (confirmed) {
        this.apiService.deleteAircraft(Number(aircraftId)).subscribe({
          next: () => {
            this.loadAircraft();
            this.warningService.show(
              this.translate.instant('DASHBOARD.AIRCRAFT_DELETED'),
              'INFO'
            );
          },
          error: () => {
            this.warningService.show(
              this.translate.instant('DASHBOARD.FAILED_DELETE_AIRCRAFT'),
              'ERROR'
            );
          },
        });
      }
    }
  }

  loadAircraft(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getUserAircraft().subscribe({
      next: (data) => {
        this.aircraftList = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading aircraft:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = this.translate.instant('DASHBOARD.SESSION_EXPIRED');
        } else {
          this.error = this.translate.instant('DASHBOARD.FAILED_LOAD_AIRCRAFT');
        }
        this.loading = false;
      },
    });
  }

  ngOnInit(): void {
    this.loadAircraft();
  }

  openAddAircraftModal(): void {
    this.showAddAircraftModal = true;
  }

  closeAddAircraftModal(): void {
    this.showAddAircraftModal = false;
  }

  openMenageResponsibleModal(aircraftId?: number): void {
    this.selectedAircraftId = aircraftId;
    this.showMenageResponsibleModal = true;
  }

  closeMenageResponsibleModal(): void {
    this.showMenageResponsibleModal = false;
  }

  saveResponsible(responsible: any): void {
    // Get the user ID from the JWT token
    const token = localStorage.getItem('token');
    let userId: number | undefined;

    if (token) {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      userId = tokenPayload.id;
    }

    if (!userId) {
      this.error = this.translate.instant('DASHBOARD.SESSION_EXPIRED');
      return;
    }

    // Prepare data for API
    const newResponsible = {
      ...responsible,
      aircraft_id: this.selectedAircraftId,
    };

    this.apiService.addResponsible(newResponsible).subscribe({
      next: (response) => {
        if (response) this.closeMenageResponsibleModal();
        if (response.status === 201)
          this.warningService.show(
            this.translate.instant('DASHBOARD.RESPONSIBLE_CREATED'),
            'INFO'
          );
      },
      error: (err) => {
        console.error('Error adding responsible:', err);
        this.error =
          err.error.message ||
          this.translate.instant('DASHBOARD.FAILED_ADD_AIRCRAFT');
        // This will be called for 400, 500, etc.
        if (err.status === 400) {
          this.warningService.show(
            this.translate.instant('DASHBOARD.RESPONSIBLE_EXISTS'),
            'ERROR'
          );
        } else {
          this.warningService.show(
            this.translate.instant('DASHBOARD.UNEXPECTED_ERROR', {
              error: err.message,
            }),
            'ERROR'
          );
        }
      },
    });
  }

  saveAircraft(aircraft: any): void {
    // Get the user ID from the JWT token
    const token = localStorage.getItem('token');
    let userId: number | undefined;

    if (token) {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      userId = tokenPayload.id;
    }

    if (!userId) {
      this.error = this.translate.instant('DASHBOARD.SESSION_EXPIRED');
      return;
    }

    // Prepare data for API
    const newAircraft = {
      ...aircraft,
      user_id: userId,
    };

    this.apiService.addAircraft(newAircraft).subscribe({
      next: (response) => {
        // If your backend returns the created aircraft, you can check for its properties
        if (response && response.registration) {
          this.warningService.show(
            this.translate.instant('DASHBOARD.AIRCRAFT_CREATED'),
            'INFO'
          );
          this.loadAircraft();
          this.closeAddAircraftModal();
        } else {
          // Fallback for unexpected response
          this.warningService.show(
            this.translate.instant('DASHBOARD.UNEXPECTED_RESPONSE'),
            'WARN'
          );
        }
      },
      error: (err) => {
        // Handle specific backend errors
        if (
          err.status === 400 &&
          err.error &&
          err.error.message === 'Aircraft already exists'
        ) {
          this.warningService.show(
            this.translate.instant('DASHBOARD.AIRCRAFT_EXISTS'),
            'WARN'
          );
        } else {
          this.warningService.show(
            this.translate.instant('DASHBOARD.FAILED_ADD_AIRCRAFT'),
            'ERROR'
          );
        }
        this.error =
          err.error?.message ||
          this.translate.instant('DASHBOARD.FAILED_ADD_AIRCRAFT');
      },
    });
  }
}
