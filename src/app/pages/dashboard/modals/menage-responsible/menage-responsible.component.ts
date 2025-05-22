import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { Responsible } from '../../../../models/responsible.model';
import { WarningService } from '../../../../services/warning.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-menage-responsible',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './menage-responsible.component.html',
  styleUrl: './menage-responsible.component.css',
})
export class MenageResponsibleComponent implements OnChanges {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Input() responsibleAircraft_id: number | undefined;
  responsibleList: Responsible[] = [];
  editingResponsibleId: number | null = null;

  constructor(
    private apiService: ApiService,
    private warningService: WarningService,
    private translate: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['responsibleAircraft_id'] &&
      this.responsibleAircraft_id !== undefined
    ) {
      this.loadResponsible();
    }
  }

  loadResponsible(): void {
    if (!this.responsibleAircraft_id) {
      console.error('No aircraft ID provided!');
      return;
    }

    this.apiService
      .getAircraftResponsible(this.responsibleAircraft_id)
      .subscribe({
        next: (data) => {
          this.responsibleList = data;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error loading responsible:', err);
          this.error = this.translate.instant('MENAGE_RESPONSIBLE.ERROR_LOAD');
          if (err.status === 404) {
            this.responsibleList = []; // Ensure empty array for 404
          }
        },
      });
  }
  responsible = {
    name: '',
    role: '',
    color: '#0d6efd',
  };

  error: string | null = null;

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    if (
      !this.responsible.name ||
      !this.responsible.role ||
      !this.responsible.color
    ) {
      this.error = this.translate.instant(
        'MENAGE_RESPONSIBLE.ERROR_FILL_FIELDS'
      );
      return;
    }

    this.error = null;

    if (this.editingResponsibleId) {
      // Edit mode: call update API
      this.apiService
        .updateResponsible(this.editingResponsibleId, this.responsible)
        .subscribe({
          next: () => {
            this.loadResponsible();
            this.warningService.show(
              this.translate.instant('MENAGE_RESPONSIBLE.UPDATED'),
              'INFO'
            );
            this.resetForm();
          },
          error: (err: HttpErrorResponse) => {
            this.error = this.translate.instant(
              'MENAGE_RESPONSIBLE.ERROR_UPDATE'
            );
            this.warningService.show(
              this.translate.instant('MENAGE_RESPONSIBLE.ERROR_UPDATE'),
              'ERROR'
            );
          },
        });
    } else {
      // Add mode: emit save event (existing logic)
      this.save.emit(this.responsible);
      this.resetForm();
    }
  }

  resetForm(): void {
    this.responsible = {
      name: '',
      role: '',
      color: '#0d6efd',
    };
    this.editingResponsibleId = null;
  }

  editResponsible(person: Responsible): void {
    this.responsible = {
      name: person.name,
      role: person.role,
      color: person.color,
    };
    this.editingResponsibleId = Number(person.id);
  }

  async deleteResponsible(id: number | undefined): Promise<void> {
    if (!id || !this.responsibleAircraft_id) {
      this.error = this.translate.instant(
        'MENAGE_RESPONSIBLE.ERROR_CANNOT_DELETE'
      );
      return;
    }

    const confirmed = await this.warningService.confirm(
      this.translate.instant('MENAGE_RESPONSIBLE.CONFIRM_DELETE')
    );
    if (!confirmed) return;

    this.apiService.deleteResponsible(id).subscribe({
      next: () => {
        this.loadResponsible(); // Reload the list after deletion
        this.warningService.show(
          this.translate.instant('MENAGE_RESPONSIBLE.DELETED'),
          'INFO'
        );
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error deleting responsible:', err);
        this.error = this.translate.instant('MENAGE_RESPONSIBLE.ERROR_DELETE');
        this.warningService.show(
          this.translate.instant('MENAGE_RESPONSIBLE.ERROR_DELETE'),
          'ERROR'
        );
      },
    });
  }
}
