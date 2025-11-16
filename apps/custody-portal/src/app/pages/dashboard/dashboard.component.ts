import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../store/app.state';
import { AssetService } from '../../services/asset.service';
import { DashboardStats, Transaction } from '../../types';
import { selectAllAssets, selectTotalAssetsValue } from '../../store/asset/asset.selectors';
import { selectPendingWithdrawalsCount, selectActiveTransactionsCount } from '../../store/custody/custody.selectors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error: string | null = null;

  totalValue$: Observable<number>;
  pendingWithdrawals$: Observable<number>;
  activeTransactions$: Observable<number>;

  displayedColumns = ['assetSymbol', 'type', 'amount', 'status', 'createdAt'];
  recentActivity: Transaction[] = [];

  constructor(
    private assetService: AssetService,
    private store: Store<AppState>
  ) {
    this.totalValue$ = this.store.select(selectTotalAssetsValue);
    this.pendingWithdrawals$ = this.store.select(selectPendingWithdrawalsCount);
    this.activeTransactions$ = this.store.select(selectActiveTransactionsCount);
  }

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.assetService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.recentActivity = stats.recentActivity;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load dashboard statistics';
        this.loading = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
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
      default:
        return 'default';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'deposit':
        return 'arrow_downward';
      case 'withdrawal':
        return 'arrow_upward';
      case 'transfer':
        return 'swap_horiz';
      default:
        return 'help';
    }
  }
}
