import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type Severity =
  | 'DEBUG'
  | 'INFO'
  | 'WARN'
  | 'ERROR'
  | 'MESSAGE'
  | 'CONFIRM';

export interface WarningMessage {
  message: string;
  severity: Severity;
  timestamp: Date;
  confirmCallback?: (confirmed: boolean) => void;
  duration?: number; // in ms
  position?: string; // e.g., 'top-left', 'top-right', etc.
}

@Injectable({
  providedIn: 'root',
})
export class WarningService {
  private colorMap: Record<Severity, string> = {
    DEBUG: 'color: cyan',
    INFO: 'color: green',
    WARN: 'color: orange',
    ERROR: 'color: red',
    MESSAGE: 'color: magenta',
    CONFIRM: 'color: red',
  };

  private labelMap: Record<Severity, string> = {
    DEBUG: '[DEBUG]',
    INFO: '[INFO]',
    WARN: '[WARN]',
    ERROR: '[ERROR]',
    MESSAGE: '[MESSAGE]',
    CONFIRM: '[CONFIRM]',
  };

  private warningSubject = new Subject<WarningMessage>();
  warning$ = this.warningSubject.asObservable();

  show(
    message: string,
    severity: Severity = 'MESSAGE',
    duration?: number,
    position: string = 'center'
  ) {
    const timestamp = new Date();
    const color = this.colorMap[severity] || 'color: magenta';
    const label = this.labelMap[severity] || '[MESSAGE]';
    // eslint-disable-next-line no-console
    console.log(`%c${label}\t${timestamp.toLocaleString()}: ${message}`, color);

    // Emit for UI
    this.warningSubject.next({
      message,
      severity,
      timestamp,
      duration,
      position,
    });
  }

  confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.warningSubject.next({
        message,
        severity: 'CONFIRM',
        timestamp: new Date(),
        confirmCallback: resolve,
      });
    });
  }
}
