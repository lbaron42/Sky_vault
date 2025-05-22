import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WarningService, WarningMessage } from '../../services/warning.service';

@Component({
  selector: 'app-warning-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="toast"
      [ngClass]="[toast.severity.toLowerCase(), toast.position || 'center']"
      class="toast"
    >
      <strong *ngIf="toast.severity !== 'CONFIRM'"
        >{{ toast.severity }}:</strong
      >
      <span [innerHTML]="formatMessage(toast.message)"></span>
      <div *ngIf="toast.severity === 'CONFIRM'" class="confirm-actions">
        <button (click)="respond(true)" class="confirm-btn">Yes</button>
        <button (click)="respond(false)" class="cancel-btn">No</button>
      </div>
    </div>
  `,
  styleUrls: ['./warning-toast.component.css'],
})
export class WarningToastComponent implements OnInit {
  toast: WarningMessage | null = null;
  private timeout: any;

  constructor(private warningService: WarningService) {}

  ngOnInit() {
    this.warningService.warning$.subscribe((msg) => {
      this.toast = msg;
      clearTimeout(this.timeout);
      if (msg.severity !== 'CONFIRM') {
        const duration = msg.duration ?? 1500;
        this.timeout = setTimeout(() => (this.toast = null), duration);
      }
    });
  }

  respond(confirmed: boolean) {
    if (this.toast?.confirmCallback) {
      this.toast.confirmCallback(confirmed);
    }
    this.toast = null;
  }

  formatMessage(message: string): string {
    // Split on newline, wrap the second line in a centered div
    const parts = message.split('\n');
    if (parts.length > 1) {
      return `${parts[0]}<div style="text-align:center;">${parts
        .slice(1)
        .join('<br>')}</div>`;
    }
    return message;
  }
}
