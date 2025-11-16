import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'assets',
        loadComponent: () => import('./pages/assets/assets.component')
          .then(m => m.AssetsComponent)
      },
      {
        path: 'deposits',
        loadComponent: () => import('./pages/deposits/deposits.component')
          .then(m => m.DepositsComponent)
      },
      {
        path: 'withdrawals',
        loadComponent: () => import('./pages/withdrawals/withdrawals.component')
          .then(m => m.WithdrawalsComponent)
      },
      {
        path: 'reconciliation',
        loadComponent: () => import('./pages/reconciliation/reconciliation.component')
          .then(m => m.ReconciliationComponent)
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
