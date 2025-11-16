import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../store/app.state';
import { Deposit } from '../../types';
import { selectAllDeposits, selectDepositsLoading } from '../../store/custody/custody.selectors';
import { loadDeposits } from '../../store/custody/custody.actions';

@Component({
  selector: 'app-deposits',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './deposits.component.html',
  styleUrls: ['./deposits.component.scss']
})
export class DepositsComponent implements OnInit {
  deposits$: Observable<Deposit[]>;
  loading$: Observable<boolean>;

  displayedColumns = ['asset', 'amount', 'fromAddress', 'txHash', 'confirmations', 'status', 'reconciled', 'createdAt'];

  constructor(private store: Store<AppState>) {
    this.deposits$ = this.store.select(selectAllDeposits);
    this.loading$ = this.store.select(selectDepositsLoading);
  }

  ngOnInit(): void {
    this.loadDeposits();
  }

  loadDeposits(): void {
    this.store.dispatch(loadDeposits({ page: 1, pageSize: 50 }));
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
        return 'error';
      case 'confirming':
        return 'info';
      default:
        return 'default';
    }
  }

  truncateHash(hash: string | undefined): string {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  }

  truncateAddress(address: string | undefined): string {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  }
}
