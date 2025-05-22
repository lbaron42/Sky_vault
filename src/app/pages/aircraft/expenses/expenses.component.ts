import imageCompression from 'browser-image-compression';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { WarningService } from '../../../services/warning.service';
import { WarningToastComponent } from '../../../components/warning-toast/warning-toast.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WarningToastComponent,
    TranslateModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css',
})
export class ExpensesComponent implements OnInit {
  @Input() aircraftId?: number;
  @Input() responsibleList: any[] = [];
  @Input() pilotList: any[] = []; // Placeholder for pilot dropdown
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  responsibleId: number | null = null;
  pilotId: number | null = null;
  category: string = '';
  date: string = '';
  amount: string = '';
  notes: string = '';

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  loading: boolean = false;

  modalImage: string | null = null;

  cameraStream: MediaStream | null = null;
  showCameraModal = false;

  // Categories as per migration
  categories = [
    { value: 'accommodation' },
    { value: 'meals' },
    { value: 'snacks' },
    { value: 'ground_transport' },
    { value: 'crew_transport' },
    { value: 'fuel' },
    { value: 'planning' },
    { value: 'navigation' },
    { value: 'other' },
  ];

  constructor(
    private ApiService: ApiService,
    private warningService: WarningService,
    private translate: TranslateService,
    private zone: NgZone
  ) {}

  ngOnInit() {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      let files = Array.from(input.files);
      if (files.length + this.selectedFiles.length > 1) {
        files = files.slice(0, 1 - this.selectedFiles.length);
        this.warningService.show(
          this.translate.instant('EXPENSE.UPLOAD_LIMIT_WARNING'),
          'WARN'
        );
      }
      this.selectedFiles = [...this.selectedFiles, ...files].slice(0, 1);
      this.imagePreviews = [];
      for (const file of this.selectedFiles) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  async compressFile(file: File): Promise<File> {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Compression error:', error);
      return file;
    }
  }

  async onSave() {
    // Validation: required fields
    if (!this.responsibleId || !this.category || !this.date || !this.amount) {
      this.warningService.show(
        this.translate.instant('COST.ERROR_FILL_REQUIRED'),
        'WARN'
      );
      return;
    }
    this.loading = true;
    let receipt_urls: string[] = [];
    if (this.selectedFiles.length > 0) {
      const compressedFiles = await Promise.all(
        this.selectedFiles.map((file) => this.compressFile(file))
      );
      this.ApiService.uploadReceipts(compressedFiles).subscribe({
        next: (res) => {
          this.loading = false;
          receipt_urls = res.urls;
          this.save.emit({
            aircraft_id: this.aircraftId,
            responsible_id: this.responsibleId,
            pilot_id: this.pilotId,
            category: this.category,
            date: this.date,
            amount:
              typeof this.amount === 'string'
                ? parseFloat(this.amount.replace(',', '.'))
                : this.amount,
            receipt_photos: receipt_urls,
            notes: this.notes,
          });
        },
        error: (err) => {
          this.loading = false;
          this.warningService.show(
            this.translate.instant('COST.ERROR_UPLOAD'),
            'ERROR'
          );
        },
      });
    } else {
      this.loading = false;
      this.save.emit({
        aircraft_id: this.aircraftId,
        responsible_id: this.responsibleId,
        pilot_id: this.pilotId,
        category: this.category,
        date: this.date,
        amount: Number(this.amount),
        receipt_photos: [],
        notes: this.notes,
      });
    }
  }

  onClose() {
    this.close.emit();
  }

  openImageModal(img: string) {
    this.modalImage = img.startsWith('/receipts/')
      ? 'http://localhost:3000' + img
      : img;
  }

  closeImageModal() {
    this.modalImage = null;
  }

  removeImage(index: number) {
    this.imagePreviews.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  openCamera() {
    if (this.selectedFiles.length >= 1) {
      this.warningService.show(
        this.translate.instant('EXPENSE.UPLOAD_LIMIT_WARNING'),
        'WARN'
      );
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.cameraStream = stream;
        this.showCameraModal = true;
        setTimeout(() => {
          const video = document.getElementById(
            'camera-video'
          ) as HTMLVideoElement;
          if (video) {
            video.srcObject = stream;
            video.play();
          }
        });
      })
      .catch((err) => {
        this.warningService.show('Camera access denied.', 'ERROR');
      });
  }

  async capturePhoto() {
    const video = document.getElementById('camera-video') as HTMLVideoElement;

    if (!video || video.readyState < 2) {
      await new Promise((resolve) => {
        video.onloadeddata = () => resolve(null);
      });
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `scan_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });

          if (this.selectedFiles.length < 1) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              this.selectedFiles = [file];
              this.imagePreviews = [e.target.result];
              this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                  this.zone.run(() => {
                    this.closeCamera();
                  });
                }, 30);
              });
            };
            reader.readAsDataURL(file);
          } else {
            this.warningService.show(
              this.translate.instant('EXPENSE.UPLOAD_LIMIT_WARNING'),
              'WARN'
            );
            this.closeCamera();
          }
        } else {
          this.closeCamera();
        }
      },
      'image/jpeg',
      0.95
    );
  }

  closeCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    this.showCameraModal = false;
  }

  handleUploadClick(fileInput: HTMLInputElement) {
    if (this.selectedFiles.length >= 1) {
      this.warningService.show(
        this.translate.instant('EXPENSE.UPLOAD_LIMIT_WARNING'),
        'WARN'
      );
      return;
    }
    fileInput.click();
  }
}
