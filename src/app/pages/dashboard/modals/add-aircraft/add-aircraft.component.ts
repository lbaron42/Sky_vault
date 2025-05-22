import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-add-aircraft',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    TranslateModule,
  ],
  templateUrl: './add-aircraft.component.html',
  styleUrl: './add-aircraft.component.css',
})
export class AddAircraftComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  constructor(private translate: TranslateService) {}

  aircraftImages = [
    { path: '/images/aircraftImages/helicopter.png', label: 'Helicopter' },
    { path: '/images/aircraftImages/KingAir.png', label: 'KingAir' },
    { path: '/images/aircraftImages/Cherokee.png', label: 'Cherokee' },
    { path: '/images/aircraftImages/R66.png', label: 'R66' },
    // Add more as needed
  ];

  aircraft = {
    registration: '',
    manufacturer: '',
    model: '',
    year: '',
    image_url: '',
  };

  error: string | null = null;

  // aircraft1 = {
  //   registration: '',
  //   manufacturer: '',
  //   model: '',
  //   year: '',
  //   image_url: null as File | null,
  //   imagePreview: ''
  // };

  // onImageSelected(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   if (input.files && input.files[0]) {
  //     this.aircraft.image_url2 = input.files[0];

  //     // For preview
  //     const reader = new FileReader();
  //     reader.onload = (e: any) => {
  //       this.aircraft.imagePreview = e.target.result;
  //     };
  //     reader.readAsDataURL(this.aircraft.image_url2);
  //   }
  // }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    // Validate fields
    if (
      !this.aircraft.registration ||
      !this.aircraft.manufacturer ||
      !this.aircraft.model ||
      !this.aircraft.year ||
      !this.aircraft.image_url
    ) {
      this.error = this.translate.instant('ADD_AIRCRAFT.ERROR_FILL_FIELDS');
      return;
    }

    this.error = null;

    // Emit save event with aircraft data
    this.save.emit(this.aircraft);
  }
}
