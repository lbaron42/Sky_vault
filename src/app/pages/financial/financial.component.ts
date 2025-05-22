import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ExpenseMock {
  id: number;
  date: string;
  category: string;
  amount: number;
  pilot: string;
  notes?: string;
  paid?: boolean;
}

@Component({
  selector: 'app-financial',
  imports: [CommonModule, FormsModule],
  templateUrl: './financial.component.html',
  styleUrl: './financial.component.css',
})
export class FinancialComponent {
  aircraftId: string | null = null;

  // Mock data for pending expenses
  pendingExpenses: ExpenseMock[] = [
    {
      id: 1,
      date: '2024-05-01',
      category: 'fuel',
      amount: 350.0,
      pilot: 'Guilherme',
      notes: 'Refuel SDEN',
    },
    {
      id: 2,
      date: '2024-05-03',
      category: 'meals',
      amount: 120.5,
      pilot: 'Fernanda',
      notes: 'Lunch at airport',
    },
    {
      id: 3,
      date: '2024-05-05',
      category: 'ground_transport',
      amount: 80.0,
      pilot: 'Manuel',
      notes: 'Taxi to hotel',
    },
    {
      id: 4,
      date: '2024-05-06',
      category: 'accommodation',
      amount: 600.0,
      pilot: 'Emprestimo',
      notes: 'Hotel night',
    },
    {
      id: 5,
      date: '2024-05-07',
      category: 'other',
      amount: 150.0,
      pilot: 'Fretado',
      notes: 'Miscellaneous',
    },
  ];

  selectedExpenses: boolean[] = Array(5).fill(false);
  showConfirmation = false;
  selectedFile: File | null = null;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.aircraftId = this.route.snapshot.paramMap.get('id');
  }

  get allSelected(): boolean {
    return (
      this.selectedExpenses.every(Boolean) && this.selectedExpenses.length > 0
    );
  }

  get anySelected(): boolean {
    return this.selectedExpenses.some(Boolean);
  }

  get selectedTotal(): number {
    return this.pendingExpenses
      .filter((_, i) => this.selectedExpenses[i])
      .reduce((sum, exp) => sum + exp.amount, 0);
  }

  get selectedExpensesList(): ExpenseMock[] {
    return this.pendingExpenses.filter((_, i) => this.selectedExpenses[i]);
  }

  toggleAll() {
    const value = !this.allSelected;
    this.selectedExpenses = this.selectedExpenses.map(() => value);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  markAsPaid() {
    if (!this.anySelected) return;
    this.showConfirmation = true;
  }

  confirmPayment() {
    // Remove selected expenses from pending (simulate marking as paid)
    this.pendingExpenses = this.pendingExpenses.filter(
      (_, i) => !this.selectedExpenses[i]
    );
    this.selectedExpenses = Array(this.pendingExpenses.length).fill(false);
    this.showConfirmation = false;
    this.selectedFile = null;
    // Here you could show a toast/notification for success
  }

  cancelConfirmation() {
    this.showConfirmation = false;
  }

  goBackToAircraft() {
    if (this.aircraftId) {
      this.router.navigate(['/aircraft', this.aircraftId]);
    } else {
      this.router.navigate(['/dashboard']); // fallback
    }
  }
}
