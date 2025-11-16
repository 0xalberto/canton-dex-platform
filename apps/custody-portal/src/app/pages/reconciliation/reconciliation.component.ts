import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';

import { AssetService } from '../../services/asset.service';
import { ReconciliationReport, Discrepancy } from '../../types';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule
  ],
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.scss']
})
export class ReconciliationComponent implements OnInit {
  reports: ReconciliationReport[] = [];
  loading = false;
  error: string | null = null;

  displayedColumns = ['assetSymbol', 'expectedBalance', 'actualBalance', 'difference', 'status', 'actions'];

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.assetService.getReconciliationReports({ page: 1, pageSize: 20 }).subscribe({
      next: (response) => {
        this.reports = response.items;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load reconciliation reports';
        this.loading = false;
      }
    });
  }

  createNewReport(): void {
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    this.loading = true;
    this.assetService.createReconciliationReport({ startDate, endDate: now }).subscribe({
      next: () => {
        this.loadReports();
      },
      error: (error) => {
        this.error = error.message || 'Failed to create reconciliation report';
        this.loading = false;
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  }

  hasDiscrepancies(report: ReconciliationReport): boolean {
    return report.discrepancies.length > 0;
  }

  getUnresolvedDiscrepancies(report: ReconciliationReport): Discrepancy[] {
    return report.discrepancies.filter(d => !d.resolved);
  }
}
