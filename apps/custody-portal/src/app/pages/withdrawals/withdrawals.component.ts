import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../store/app.state';
import { Withdrawal } from '../../types';
import { selectAllWithdrawals, selectWithdrawalsLoading } from '../../store/custody/custody.selectors';
import { loadWithdrawals, approveWithdrawal } from '../../store/custody/custody.actions';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './withdrawals.component.html',
  styleUrls: ['./withdrawals.component.scss']
})
export class WithdrawalsComponent implements OnInit {
  withdrawals$: Observable<Withdrawal[]>;
  loading$: Observable<boolean>;

  displayedColumns = ['asset', 'amount', 'toAddress', 'status', 'approvals', 'createdAt', 'actions'];

  constructor(
    private store: Store<AppState>,
    private authService: AuthService
  ) {
    this.withdrawals$ = this.store.select(selectAllWithdrawals);
    this.loading$ = this.store.select(selectWithdrawalsLoading);
  }

  ngOnInit(): void {
    this.loadWithdrawals();
  }

  loadWithdrawals(): void {
    this.store.dispatch(loadWithdrawals({ page: 1, pageSize: 50 }));
  }

  canApprove(withdrawal: Withdrawal): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    return (
      user.permissions.includes('approve_withdrawals') &&
      withdrawal.status === 'pending' &&
      !withdrawal.approvals.some(a => a.userId === user.id)
    );
  }

  approve(withdrawalId: string): void {
    if (confirm('Are you sure you want to approve this withdrawal?')) {
      this.store.dispatch(approveWithdrawal({ withdrawalId }));
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'error';
      case 'confirming':
        return 'info';
      default:
        return 'default';
    }
  }

  truncateAddress(address: string): string {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }
}
