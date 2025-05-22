import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChildren,
  ChangeDetectorRef,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AddFlightComponent } from './add-flight/add-flight.component';
import { ApiService } from '../../services/api.service';
import { Responsible } from '../../models/responsible.model';
import { HoursDisplay } from '../../models/hourDisplay.model';
import { FlightsDisplay } from '../../models/flightDisplay.model';
import { WarningService } from '../../services/warning.service';
import { WarningToastComponent } from '../../components/warning-toast/warning-toast.component';
import { CostComponent } from './cost/cost.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { CostData } from '../../models/costData.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-aircraft',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AddFlightComponent,
    WarningToastComponent,
    CostComponent,
    TranslateModule,
    ExpensesComponent,
  ],
  templateUrl: './aircraft.component.html',
  styleUrl: './aircraft.component.css',
})
export class AircraftComponent implements AfterViewInit {
  @ViewChildren('yearScroll') yearScrollContainers!: QueryList<ElementRef>;
  yearScrollContainer!: ElementRef;
  showAddFlight = false;
  showCostModal = false;
  showExpensesModal = false;
  image_url: string = '';
  selectedFlightId: number | null = null;
  selectedResponsibleId: number | null = null;
  aircraft_Id: string | null = null;
  responsibleList: Responsible[] = [];
  hoursDisplay: HoursDisplay[] = [];
  flightsDisplay: FlightsDisplay[] = [];
  currentYear: number = 0;
  years: number[] = [];
  yearTotal: number = 0;
  page: number = 0;
  pageSize: number = 25;
  lineDisplay: number = 25;
  flightToEdit: any | null = null;
  icaoCode: string = '';
  aircraftRegistration: string = '';
  costData: CostData | null = null;
  jumpToPageValue: number = 1;
  expensesCount: number = 0;
  expensesTotal: number = 0;
  pilotList: any[] = []; // Placeholder for pilot dropdown

  constructor(
    private route: ActivatedRoute,
    private ApiService: ApiService,
    private warningService: WarningService,
    private router: Router,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.aircraft_Id = params.get('id');
      this.loadYears(Number(this.aircraft_Id));
    });

    // all of this just to get the image from the dashboard 😰
    const nav = this.router.getCurrentNavigation();
    if (nav && nav.extras.state) {
      if (nav.extras.state['image_url']) {
        this.image_url = nav.extras.state['image_url'];
        localStorage.setItem('aircraft_image_url', this.image_url);
      } else {
        this.image_url =
          localStorage.getItem('aircraft_image_url') ||
          '/images/aircraftImages/helicopter.png';
      }
      if (nav.extras.state['registration']) {
        this.aircraftRegistration = nav.extras.state['registration'];
        localStorage.setItem(
          'aircraft_registration',
          this.aircraftRegistration
        );
      } else {
        this.aircraftRegistration =
          localStorage.getItem('aircraft_registration') || '';
      }
    } else {
      this.image_url =
        localStorage.getItem('aircraft_image_url') ||
        '/images/aircraftImages/helicopter.png';
      this.aircraftRegistration =
        localStorage.getItem('aircraft_registration') || '';
    }
  }

  loadYears(aircraftId: number, keepYear?: number): void {
    this.ApiService.getYearList(aircraftId).subscribe({
      next: (response) => {
        this.years = response.map((item: any) => +item.year);
        if (keepYear && this.years.includes(keepYear)) {
          this.currentYear = keepYear;
        } else if (this.years.length > 0) {
          this.currentYear = this.years[this.years.length - 1];
        } else {
          this.currentYear = new Date().getFullYear();
        }
        this.loadResponsibleSummary(Number(this.aircraft_Id));
        if (this.years.length > 0) {
          this.loadFlights(
            Number(this.aircraft_Id),
            this.currentYear,
            this.page,
            this.pageSize
          );
        } else {
          this.flightsDisplay = [];
          this.yearTotal = 0;
        }
        this.getExpenses(Number(this.aircraft_Id));
        this.scrollToLastYear();
      },
    });
  }

  loadResponsibleSummary(aircraftId: number): void {
    this.ApiService.getResponsibleSummary(
      aircraftId,
      this.currentYear
    ).subscribe({
      next: (response) => {
        this.responsibleList = response.responsibles;
        this.populateHoursSummaryFromTable(response.summary);
      },
      error: (err) => {
        console.error('Failed to load responsible summary:', err);
      },
    });
  }

  loadFlights(
    aircraftId: number,
    currentYear: number,
    page: number,
    pageSize: number
  ): void {
    this.ApiService.getFlightList(
      aircraftId,
      currentYear,
      page,
      pageSize
    ).subscribe({
      next: (response) => {
        this.flightsDisplay = response.flights as FlightsDisplay[];
        this.yearTotal = response.total;

        // Guard: If no flights on this page but there are flights in total, go to previous page
        if (
          this.flightsDisplay.length === 0 &&
          this.yearTotal > 0 &&
          this.page < 0
        ) {
          this.page++;
          this.loadFlights(
            Number(this.aircraft_Id),
            this.currentYear,
            this.page,
            this.pageSize
          );
        }
      },
    });
  }

  getExpenses(aircraft_id: number): void {
    this.ApiService.getExpensesDisplay(aircraft_id).subscribe({
      next: (response) => {
        this.expensesCount = response.count;
        this.expensesTotal = response.total;
      },
      error: (err) => {
        console.error('Failed to load responsible summary:', err);
      },
    });
  }

  changeYear(year: number): void {
    this.currentYear = year;
    this.page = 0;
    this.loadResponsibleSummary(Number(this.aircraft_Id));
    this.loadFlights(
      Number(this.aircraft_Id),
      this.currentYear,
      this.page,
      this.pageSize
    );
  }

  populateHoursSummaryFromTable(results: any[]): void {
    // Clear previous data
    this.hoursDisplay = [];
    // Prepare a map for each responsible by id
    const summaryMap: { [id: number]: any } = {};
    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    const totalRow: any = { type: 'Total:', color: '#232946' };
    months.forEach((m) => (totalRow[m] = 0));

    // Initialize summary for each responsible by id
    this.responsibleList.forEach((responsible) => {
      const id = Number(responsible.id);
      if (!isNaN(id)) {
        summaryMap[id] = { type: responsible.name, color: responsible.color };
        months.forEach((m) => (summaryMap[id][m] = 0));
      }
    });

    // Fill in the data
    results.forEach((row) => {
      const monthIndex = row.month - 1; // 0-based index
      const monthKey = months[monthIndex];
      if (summaryMap[row.responsible_id]) {
        summaryMap[row.responsible_id][monthKey] = row.total_time;
        totalRow[monthKey] += row.total_time;
      }
    });

    // Push to hoursDisplay
    Object.values(summaryMap).forEach((summary) =>
      this.hoursDisplay.push(summary)
    );
    this.hoursDisplay.push(totalRow);
  }

  openAddFlightModal(): void {
    this.showAddFlight = true;
  }

  closeAddFlightModal(): void {
    this.showAddFlight = false;
    this.flightToEdit = null;
  }

  // get Responsible Names to display on Html By
  getResponsibleName(responsibleId: number): string {
    const responsible = this.responsibleList.find(
      (r) => r.id === responsibleId
    );
    return responsible ? responsible.name : '';
  }

  // calculates the min-display of the showing display and consist in the protection for not going further on going a page back both for the .ts component and the .html component
  get minPage(): number {
    if (this.yearTotal === 0 || this.flightsDisplay.length === 0) return 0;
    let shift = 1 + this.page * -1;
    return this.yearTotal - this.pageSize * shift <= 0
      ? 1
      : this.yearTotal - this.pageSize * shift + 1;
  }

  // calculates the max-display of the showing display and consist in the protection for not going further on going a page forward both for the .ts component and the .html component

  get maxPage(): number {
    if (this.yearTotal === 0 || this.flightsDisplay.length === 0) return 0;
    let shift = this.page * -1;
    return this.yearTotal - shift * this.pageSize >= this.yearTotal
      ? this.yearTotal
      : this.yearTotal - shift * this.pageSize;
  }

  //--------------- Related to the Go to: window--------------

  get currentPage(): number {
    let value = (this.page - 1) * -1;
    return value;
  }

  get roundUp(): number {
    let value = this.yearTotal / this.pageSize;
    return Math.ceil(value);
  }

  jumpToPage(value: number) {
    if (value > this.roundUp) {
      this.warningService.show(
        this.translate.instant('AIRCRAFT.PAGE_TOO_HIGH', {
          value,
          max: this.roundUp,
        }),
        'MESSAGE'
      );
      return;
    }
    if ((value - 1) * -1 === this.page) {
      this.warningService.show(
        this.translate.instant('AIRCRAFT.PAGE_ALREADY', { page: value }),
        'MESSAGE'
      );
      return;
    }
    if (value <= 0) {
      this.warningService.show(
        this.translate.instant('AIRCRAFT.PAGE_NOT_ALLOWED'),
        'MESSAGE'
      );
      return;
    }
    this.page = (value - 1) * -1;
    this.loadFlights(
      Number(this.aircraft_Id),
      this.currentYear,
      this.page,
      this.pageSize
    );
  }

  //------------------------------------------------------------

  saveFlight(flight: any): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = user.id;
    const flightData = {
      ...flight,
      user_id: userId,
    };
    this.ApiService.addFlight(flightData).subscribe({
      next: (response) => {
        this.closeAddFlightModal();
        if (response.status === 201)
          this.warningService.show(
            this.translate.instant('AIRCRAFT.FLIGHT_CREATED'),
            'INFO'
          );
        // Reload the flight list
        this.loadYears(Number(this.aircraft_Id));
        // need to call min page to properly update Showing min page when an aircraft is added
        this.minPage;
      },
      error: (error) => {
        // This will be called for 400, 500, etc.
        if (error.status === 400) {
          alert(this.translate.instant('AIRCRAFT.FLIGHT_EXISTS'));
        } else {
          alert('An unexpected error occurred: ' + error.message);
        }
      },
    });
    this.showAddFlight = false;
  }

  async deleteFlight(flightId: number): Promise<void> {
    const confirmed = await this.warningService.confirm(
      this.translate.instant('AIRCRAFT.FLIGHT_DELETE_CONFIRM')
    );
    if (confirmed) {
      const prevYear = this.currentYear;
      this.ApiService.deleteFlight(flightId).subscribe({
        next: () => {
          this.warningService.show(
            this.translate.instant('AIRCRAFT.FLIGHT_DELETED'),
            'INFO'
          );
          this.loadYears(Number(this.aircraft_Id), prevYear);
        },
        error: (error) => {
          this.warningService.show(
            this.translate.instant('AIRCRAFT.FLIGHT_DELETE_FAILED', {
              error: error.message,
            }),
            'ERROR'
          );
        },
      });
    }
  }

  openEditFlightModal(flight: any): void {
    this.flightToEdit = { ...flight }; // Deep copy to avoid mutation
    console.log(
      'Responsible ID in flight:',
      this.flightToEdit.responsible_id,
      typeof this.flightToEdit.responsible_id
    );
    console.log(
      'Responsible IDs in list:',
      this.responsibleList.map((r) => [r.id, typeof r.id])
    );
    this.flightToEdit.responsible_id = String(this.flightToEdit.responsible_id);
    this.showAddFlight = true;
  }

  updateFlight(flight: any): void {
    if (!flight.id) {
      this.warningService.show('Flight ID is missing for update', 'ERROR');
      return;
    }
    this.ApiService.updateFlight(flight.id, flight).subscribe({
      next: () => {
        this.warningService.show('Flight updated successfully', 'INFO');
        this.closeAddFlightModal();
        this.loadYears(Number(this.aircraft_Id), this.currentYear);
      },
      error: (error) => {
        this.warningService.show(
          'Failed to update flight: ' + error.message,
          'ERROR'
        );
      },
    });
  }

  sendPage(next: boolean): void {
    if (next === true) {
      // Previous page
      if (this.page < 0) {
        this.page++;
        this.loadFlights(
          Number(this.aircraft_Id),
          this.currentYear,
          this.page,
          this.pageSize
        );
      }
    } else {
      // Next page
      if (this.minPage != 1) {
        this.page--;
        this.loadFlights(
          Number(this.aircraft_Id),
          this.currentYear,
          this.page,
          this.pageSize
        );
      }
    }
  }

  setPageSize(pageS: number) {
    if (pageS < 8) {
      this.warningService.show(
        this.translate.instant('AIRCRAFT.LINES_MIN_WARNING'),
        'MESSAGE'
      );
      this.pageSize = 25;
      return;
    }
    if (pageS > 50) {
      this.warningService.show(
        this.translate.instant('AIRCRAFT.LINES_MAX_WARNING'),
        'MESSAGE'
      );
      this.pageSize = 25;
      return;
    }
    this.pageSize = pageS;
    this.warningService.show(
      this.translate.instant('AIRCRAFT.LINES_DISPLAY_INFO', {
        count: this.pageSize,
      }),
      'INFO',
      1500,
      'bottom-left'
    );
    this.loadFlights(
      Number(this.aircraft_Id),
      this.currentYear,
      this.page,
      this.pageSize
    );
  }

  // function to scroll the flight list to the end so the current year is alway visible

  ngAfterViewInit(): void {
    this.scrollToLastYear();
  }

  private scrollToLastYear(): void {
    setTimeout(() => {
      requestAnimationFrame(() => {
        this.yearScrollContainers?.forEach((container) => {
          const el = container.nativeElement;
          if (el) {
            el.scrollLeft = el.scrollWidth;
          }
        });
      });
    }, 50);
  }

  getOpaqueColor(color: string, opacity: number = 0.2): string {
    if (!color) return '';
    // If already rgba, just return
    if (color.startsWith('rgba')) return color;
    // If already rgb, add alpha
    if (color.startsWith('rgb('))
      return color.replace('rgb(', 'rgba(').replace(')', `,${opacity})`);
    // If hex, convert to rgba
    if (color.startsWith('#')) {
      let c = color.substring(1);
      if (c.length === 3)
        c = c
          .split('')
          .map((x) => x + x)
          .join('');
      const num = parseInt(c, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r},${g},${b},${opacity})`;
    }
    // fallback
    return color;
  }

  openCostModal(flightId: number, responsibleId: number): void {
    this.selectedFlightId = flightId;
    this.selectedResponsibleId = responsibleId;

    // Fetch cost data and pass it to the modal
    this.ApiService.getCostAllocation(flightId, responsibleId).subscribe({
      next: (costData) => {
        this.costData = costData; // Add a property to hold this
        this.showCostModal = true;
      },
      error: () => {
        this.costData = null;
        this.showCostModal = true; // Still open modal, but empty
      },
    });
  }

  closeCostModal(): void {
    this.showCostModal = false;
    this.selectedFlightId = null;
  }

  saveCost(cost: any): void {
    this.ApiService.addCostAllocation(cost).subscribe({
      next: () => {
        this.warningService.show('Cost saved successfully', 'INFO');
        this.closeCostModal();
        this.loadYears(Number(this.aircraft_Id), this.currentYear);
      },
      error: (error) => {
        this.warningService.show(
          'Failed to save cost: ' + error.message,
          'ERROR'
        );
      },
    });
  }

  openExpensesModal(): void {
    this.showExpensesModal = true;
    // pilotList can be populated here in the future
  }

  closeExpensesModal(): void {
    this.showExpensesModal = false;
  }

  saveExpense(expense: any): void {
    // Ensure user_id is included
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    expense.user_id = user.id;

    // If receipt_photos is an array, send only the first as receipt_url
    if (expense.receipt_photos && expense.receipt_photos.length > 0) {
      expense.receipt_url = expense.receipt_photos[0];
    }
    delete expense.receipt_photos;

    this.ApiService.addPersonalExpense(expense).subscribe({
      next: (response) => {
        this.warningService.show('Expense saved successfully', 'INFO');
        this.closeExpensesModal();
        this.getExpenses(Number(this.aircraft_Id));
      },
      error: (error) => {
        this.warningService.show(
          'Failed to save expense: ' + (error.error?.error || error.message),
          'ERROR'
        );
      },
    });
  }

  // --- Report and Export Button Handlers ---
  toFinancialReport(): void {
    this.router.navigate(['/financial', Number(this.aircraft_Id)], {});
  }

  downloadMaintenanceReport(): void {
    // Placeholder: Replace with actual report logic or API call
    alert('Maintenance Report download not implemented yet.');
  }

  exportHoursSummaryCSV(): void {
    const headers = [
      'Tipo',
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const rows = this.hoursDisplay.map((row) => [
      row.type,
      row.jan,
      row.fev,
      row.mar,
      row.abr,
      row.mai,
      row.jun,
      row.jul,
      row.ago,
      row.set,
      row.out,
      row.nov,
      row.dez,
    ]);
    this.downloadCSV([headers, ...rows], 'hours_summary.csv');
  }

  exportFlightListCSV(): void {
    const headers = [
      'Date',
      'Origin',
      'Destination',
      'Air Time (h)',
      'Total Time (h)',
      'Responsible',
      'Month',
    ];
    const rows = this.flightsDisplay.map((f) => [
      f.date,
      f.origin,
      f.destination,
      f.air_time,
      f.total_time,
      this.getResponsibleName(+f.responsible_id),
      new Date(f.date).toLocaleString('default', { month: 'short' }),
    ]);
    this.downloadCSV([headers, ...rows], 'flight_list.csv');
  }

  private downloadCSV(data: any[][], filename: string): void {
    const csvContent = data
      .map((e) => e.map((x) => '"' + (x ?? '') + '"').join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  get totalYearHours(): number {
    const totalRow = this.hoursDisplay.find((row) => row.type === 'Total:');
    if (!totalRow) return 0;
    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ];
    return months.reduce(
      (sum, m) => sum + (Number((totalRow as any)[m]) || 0),
      0
    );
  }
}
