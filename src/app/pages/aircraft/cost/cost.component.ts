import imageCompression from 'browser-image-compression';
import { CostData } from '../../../models/costData.model';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { WarningService } from '../../../services/warning.service';
import { WarningToastComponent } from '../../../components/warning-toast/warning-toast.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-cost',
  standalone: true,
  imports: [CommonModule, FormsModule, WarningToastComponent, TranslateModule],
  templateUrl: './cost.component.html',
  styleUrl: './cost.component.css',
})
export class CostComponent implements OnChanges {
  @Input() flightId!: number;
  @Input() responsibleId!: number;
  @Input() costData: CostData | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  receipt_photo: string = '';
  notes: string = '';

  direct_cost: number | null = null;
  hangar: number | null = null;
  fuel: number | null = null;

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  loading: boolean = false;
  modalImage: string | null = null;

  cameraStream: MediaStream | null = null;
  showCameraModal = false;

  constructor(
    private ApiService: ApiService,
    private warningService: WarningService,
    private translate: TranslateService,
    private zone: NgZone
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['costData'] && this.costData) {
      this.direct_cost = this.costData.direct_cost ?? null;
      this.hangar = this.costData.hangar ?? null;
      this.fuel = this.costData.fuel ?? null;
      this.notes = this.costData.notes || '';
      this.imagePreviews = this.costData.receipt_photos || [];
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      let files = Array.from(input.files);
      if (files.length + this.selectedFiles.length > 3) {
        files = files.slice(0, 3 - this.selectedFiles.length);
        this.warningService.show(
          this.translate.instant('COST.UPLOAD_LIMIT_WARNING'),
          'WARN'
        );
      }
      this.selectedFiles = [...this.selectedFiles, ...files].slice(0, 3);
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
      maxSizeMB: 0.5, // Target size (in MB)
      maxWidthOrHeight: 1024, // Resize if needed
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Compression error:', error);
      return file; // fallback to original
    }
  }

  async onSave() {
    // Validation: at least one cost field must be filled and non-zero
    const isEmpty = (v: any) =>
      v === null || v === undefined || v === '' || Number(v) === 0;
    if (
      isEmpty(this.direct_cost) &&
      isEmpty(this.hangar) &&
      isEmpty(this.fuel)
    ) {
      this.warningService.show(
        this.translate.instant('COST.ERROR_FILL_ONE'),
        'WARN'
      );
      return;
    }
    this.loading = true;
    if (this.selectedFiles.length > 0) {
      const compressedFiles = await Promise.all(
        this.selectedFiles.map((file) => this.compressFile(file))
      );
      this.ApiService.uploadReceipts(compressedFiles).subscribe({
        next: (res) => {
          this.loading = false;
          this.save.emit({
            flight_id: this.flightId,
            responsible_id: this.responsibleId,
            direct_cost: this.direct_cost,
            hangar: this.hangar,
            fuel: this.fuel,
            notes: this.notes,
            receipt_photos: res.urls,
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
        flight_id: this.flightId,
        responsible_id: this.responsibleId,
        direct_cost: this.direct_cost,
        hangar: this.hangar,
        fuel: this.fuel,
        notes: this.notes,
        receipt_photos: [],
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
    if (this.selectedFiles.length >= 3) {
      this.warningService.show(
        this.translate.instant('COST.UPLOAD_LIMIT_WARNING'),
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

          if (this.selectedFiles.length < 3) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              this.selectedFiles.push(file);
              this.imagePreviews.push(e.target.result);
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
              this.translate.instant('COST.UPLOAD_LIMIT_WARNING'),
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
    if (this.selectedFiles.length >= 3) {
      this.warningService.show(
        this.translate.instant('COST.UPLOAD_LIMIT_WARNING'),
        'WARN'
      );
      return;
    }
    fileInput.click();
  }
}
