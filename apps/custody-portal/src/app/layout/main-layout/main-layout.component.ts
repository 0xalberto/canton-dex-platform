import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { User } from '../../types';
import { AppState } from '../../store/app.state';
import { selectPendingWithdrawalsCount } from '../../store/custody/custody.selectors';
import { loadAssets } from '../../store/asset/asset.actions';
import { loadCustodyAccounts } from '../../store/custody/custody.actions';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  currentUser$: Observable<User | null>;
  pendingWithdrawalsCount$: Observable<number>;
  isConnected = false;

  menuItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/assets', icon: 'account_balance_wallet', label: 'Assets' },
    { path: '/deposits', icon: 'arrow_downward', label: 'Deposits' },
    { path: '/withdrawals', icon: 'arrow_upward', label: 'Withdrawals', badge: 'pendingWithdrawals' },
    { path: '/reconciliation', icon: 'fact_check', label: 'Reconciliation' }
  ];

  constructor(
    private authService: AuthService,
    private wsService: WebSocketService,
    private store: Store<AppState>
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.pendingWithdrawalsCount$ = this.store.select(selectPendingWithdrawalsCount);
  }

  ngOnInit(): void {
    // Load initial data
    this.store.dispatch(loadAssets());
    this.store.dispatch(loadCustodyAccounts());

    // Connect to WebSocket
    this.wsService.connect();
    this.wsService.getConnectionStatus().subscribe(
      status => this.isConnected = status
    );

    // Subscribe to balance updates
    this.wsService.subscribeToAssets();
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
  }

  getBadgeCount(badgeType: string): Observable<number> | null {
    switch (badgeType) {
      case 'pendingWithdrawals':
        return this.pendingWithdrawalsCount$;
      default:
        return null;
    }
  }
}
