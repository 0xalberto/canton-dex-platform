import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';

import { AppState } from '../../store/app.state';
import { Asset } from '../../types';
import { selectAllAssets, selectAssetsLoading, selectAssetsError } from '../../store/asset/asset.selectors';
import { loadAssets, updateAssetBalance } from '../../store/asset/asset.actions';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.scss']
})
export class AssetsComponent implements OnInit, OnDestroy {
  assets$: Observable<Asset[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  displayedColumns = ['symbol', 'name', 'balance', 'available', 'locked', 'usdValue', 'change24h', 'actions'];

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store<AppState>,
    private wsService: WebSocketService
  ) {
    this.assets$ = this.store.select(selectAllAssets);
    this.loading$ = this.store.select(selectAssetsLoading);
    this.error$ = this.store.select(selectAssetsError);
  }

  ngOnInit(): void {
    this.store.dispatch(loadAssets());

    // Subscribe to real-time balance updates
    this.wsService.onBalanceUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        this.store.dispatch(updateAssetBalance({ update }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.store.dispatch(loadAssets());
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatBalance(balance: string, decimals: number = 8): string {
    const num = parseFloat(balance);
    return num.toFixed(decimals);
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }
}
