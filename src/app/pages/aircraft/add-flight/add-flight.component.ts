import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Responsible } from '../../../models/responsible.model';
import { ApiService } from '../../../services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WarningService } from '../../../services/warning.service';
import { WarningToastComponent } from '../../../components/warning-toast/warning-toast.component';

@Component({
  selector: 'app-add-flight',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    WarningToastComponent,
  ],
  templateUrl: './add-flight.component.html',
  styleUrl: './add-flight.component.css',
})
export class AddFlightComponent {
  @Output() close = new EventEmitter<void>();

  // NOTE - Correct AM/PM problem - when adding an hour and it is close to mid day and if you add 11:00 AM and 12:01 AM it add 13 hour it can confuse the user

  @Output() save = new EventEmitter<any>();
  @Output() update = new EventEmitter<any>();
  @Input() aircraftId: number | undefined;
  @Input() responsibleList: Responsible[] = [];
  @Input() flightToEdit: any | null = null;
  icaoToAdd: string = '';
  customOrigin: string = '';
  customDestination: string = '';
  error: string | null = null;
  favoriteIcaoCodes: string[] = [];
  showIcaoList = false;

  constructor(
    private translate: TranslateService,
    private warningService: WarningService,
    private ApiService: ApiService
  ) {}

  flight = {
    date: '',
    origin: '',
    destination: '',
    start_up: '',
    takeoff: '',
    landing: '',
    shutdown: '',
    air_time: 0,
    total_time: 0,
    responsible_id: '',
    notes: '',
  };

  airport = {
    icao_code: '',
  };

  ngOnInit(): void {
    if (this.flightToEdit) {
      this.flight = { ...this.flightToEdit };
      // Format date for input[type=date]
      if (this.flight.date) {
        this.flight.date = this.flight.date.slice(0, 10); // works for ISO strings
        // If date is not ISO, use a date formatting function here
      }
      this.flight.responsible_id = String(this.flight.responsible_id);
      if (!this.flight.notes) this.flight.notes = '';
    }
    this.ApiService.getFavoriteIcaoCodes().subscribe({
      next: (data) => {
        // data is an array of objects with icao_code property
        this.favoriteIcaoCodes = data.map((item: any) => item.icao_code);
      },
      error: (err) => {
        // Optionally handle error
        this.favoriteIcaoCodes = [];
      },
    });
  }

  getBlockTime(): string {
    if (this.flight.start_up && this.flight.shutdown) {
      const minutes = this.getMinutesDiff(
        this.flight.start_up,
        this.flight.shutdown
      );
      return this.minutesToDecimal(minutes);
    }
    return '';
  }

  getAirTime(): string {
    if (this.flight.takeoff && this.flight.landing) {
      const minutes = this.getMinutesDiff(
        this.flight.takeoff,
        this.flight.landing
      );
      return this.minutesToDecimal(minutes);
    }
    return '';
  }

  getSelectedResponsibleLabel(): string {
    if (!this.flight.responsible_id) return 'Responsible';
    const responsible = this.responsibleList.find(
      (r) => r.id === Number(this.flight.responsible_id)
    );
    return responsible
      ? `${responsible.name} (${responsible.role})`
      : 'Responsible';
  }

  private getMinutesDiff(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins < startMins) endMins += 24 * 60; // handle overnight
    return endMins - startMins;
  }

  private minutesToDecimal(minutes: number): string {
    const tenths = Math.floor((minutes + 2.9999) / 6);
    const hours = Math.floor(tenths / 10);
    const decimal = tenths % 10;
    return `${hours}.${decimal}`;
  }

  onSave(): void {
    if (
      !this.flight.date ||
      !this.flight.origin ||
      !this.flight.destination ||
      !this.flight.start_up ||
      !this.flight.takeoff ||
      !this.flight.landing ||
      !this.flight.shutdown ||
      !this.flight.responsible_id
    ) {
      this.error = this.translate.instant('ADD_FLIGHT.ERROR_FILL_FIELDS');
      return;
    }
    // Reset error
    this.error = null;

    // Calculate and set total_time and air_time
    this.flight.total_time = parseFloat(this.getBlockTime()) || 0;
    this.flight.air_time = parseFloat(this.getAirTime()) || 0;

    // Cast IDs to numbers
    const flightToEmit = {
      ...this.flight,
      responsible_id: +this.flight.responsible_id,
      aircraft_id: this.aircraftId !== undefined ? +this.aircraftId : undefined,
    };

    // Emit save event with flight data
    if (this.flightToEdit) {
      this.update.emit(flightToEmit);
    } else {
      this.save.emit(flightToEmit);
    }
  }

  addIcaoToFavorites(icao: string): void {
    icao = icao.toUpperCase();
    // Only allow 4-letter codes, letters only
    if (!/^[A-Z]{4}$/.test(icao)) {
      this.warningService.show(
        this.translate.instant('ADD_FLIGHT.INVALID_ICAO_CODE'),
        'WARN'
      );
      return;
    }
    this.airport.icao_code = icao;
    this.ApiService.addIcaoCode(this.airport).subscribe({
      next: (response) => {
        console.log(response);
        this.warningService.show('ICAO code stored successfully', 'INFO');
        this.icaoToAdd = '';
        this.loadFavoriteIcaoCodes();
      },
      error: (err) => {
        if (err.status === 400) {
          this.warningService.show(
            this.translate.instant('ADD_FLIGHT.ICAO_ALREADY_ON_LIST')
          );
        } else {
          this.warningService.show(
            this.translate.instant('ADD_FLIGHT.FAILED_ADD_ICAO_CODE'),
            'ERROR'
          );
        }
      },
    });
  }

  loadFavoriteIcaoCodes(): void {
    this.ApiService.getFavoriteIcaoCodes().subscribe({
      next: (data) => {
        this.favoriteIcaoCodes = data.map((item: any) => item.icao_code);
      },
      error: (err) => {
        this.favoriteIcaoCodes = [];
      },
    });
  }

  onCancel(): void {
    this.close.emit();
  }

  deleteIcaoCode(icao: string) {
    // Call your API to delete, then reload the list
    this.ApiService.deleteIcaoCode(icao).subscribe({
      next: () => this.loadFavoriteIcaoCodes(),
      error: () =>
        this.warningService.show(
          this.translate.instant('ADD_FLIGHT.FAILED_DELETE_ICAO_CODE'),
          'ERROR'
        ),
    });
  }
}
