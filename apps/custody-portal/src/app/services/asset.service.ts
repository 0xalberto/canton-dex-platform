import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Asset,
  AssetDetail,
  Transaction,
  Deposit,
  Withdrawal,
  CustodyAccount,
  WalletAddress,
  ReconciliationReport,
  DashboardStats,
  TransactionFilter,
  PaginationParams,
  PaginatedResponse
} from '../types';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  constructor(private apiService: ApiService) {}

  // Asset Management
  /**
   * Get all assets
   */
  getAssets(): Observable<Asset[]> {
    return this.apiService.get<Asset[]>('/assets');
  }

  /**
   * Get asset by ID
   */
  getAssetById(assetId: string): Observable<AssetDetail> {
    return this.apiService.get<AssetDetail>(`/assets/${assetId}`);
  }

  /**
   * Get asset balance
   */
  getAssetBalance(assetId: string): Observable<{ balance: string; availableBalance: string; lockedBalance: string }> {
    return this.apiService.get(`/assets/${assetId}/balance`);
  }

  // Transaction Management
  /**
   * Get all transactions with pagination
   */
  getTransactions(
    pagination: PaginationParams,
    filters?: TransactionFilter
  ): Observable<PaginatedResponse<Transaction>> {
    return this.apiService.getPaginated<Transaction>('/transactions', pagination, filters);
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(transactionId: string): Observable<Transaction> {
    return this.apiService.get<Transaction>(`/transactions/${transactionId}`);
  }

  // Deposit Management
  /**
   * Get all deposits
   */
  getDeposits(
    pagination: PaginationParams,
    filters?: TransactionFilter
  ): Observable<PaginatedResponse<Deposit>> {
    return this.apiService.getPaginated<Deposit>('/deposits', pagination, filters);
  }

  /**
   * Get deposit by ID
   */
  getDepositById(depositId: string): Observable<Deposit> {
    return this.apiService.get<Deposit>(`/deposits/${depositId}`);
  }

  /**
   * Mark deposit as reconciled
   */
  reconcileDeposit(depositId: string): Observable<Deposit> {
    return this.apiService.post<Deposit>(`/deposits/${depositId}/reconcile`, {});
  }

  // Withdrawal Management
  /**
   * Get all withdrawals
   */
  getWithdrawals(
    pagination: PaginationParams,
    filters?: TransactionFilter
  ): Observable<PaginatedResponse<Withdrawal>> {
    return this.apiService.getPaginated<Withdrawal>('/withdrawals', pagination, filters);
  }

  /**
   * Get withdrawal by ID
   */
  getWithdrawalById(withdrawalId: string): Observable<Withdrawal> {
    return this.apiService.get<Withdrawal>(`/withdrawals/${withdrawalId}`);
  }

  /**
   * Create withdrawal request
   */
  createWithdrawal(withdrawal: {
    assetId: string;
    amount: string;
    toAddress: string;
    network: string;
  }): Observable<Withdrawal> {
    return this.apiService.post<Withdrawal>('/withdrawals', withdrawal);
  }

  /**
   * Approve withdrawal
   */
  approveWithdrawal(withdrawalId: string, signature?: string): Observable<Withdrawal> {
    return this.apiService.post<Withdrawal>(`/withdrawals/${withdrawalId}/approve`, { signature });
  }

  /**
   * Reject withdrawal
   */
  rejectWithdrawal(withdrawalId: string, reason: string): Observable<Withdrawal> {
    return this.apiService.post<Withdrawal>(`/withdrawals/${withdrawalId}/reject`, { reason });
  }

  /**
   * Cancel withdrawal
   */
  cancelWithdrawal(withdrawalId: string): Observable<Withdrawal> {
    return this.apiService.post<Withdrawal>(`/withdrawals/${withdrawalId}/cancel`, {});
  }

  // Custody Account Management
  /**
   * Get all custody accounts
   */
  getCustodyAccounts(): Observable<CustodyAccount[]> {
    return this.apiService.get<CustodyAccount[]>('/custody/accounts');
  }

  /**
   * Get custody account by ID
   */
  getCustodyAccountById(accountId: string): Observable<CustodyAccount> {
    return this.apiService.get<CustodyAccount>(`/custody/accounts/${accountId}`);
  }

  /**
   * Create custody account
   */
  createCustodyAccount(account: {
    name: string;
    type: 'hot' | 'warm' | 'cold';
  }): Observable<CustodyAccount> {
    return this.apiService.post<CustodyAccount>('/custody/accounts', account);
  }

  // Wallet Address Management
  /**
   * Get wallet addresses
   */
  getWalletAddresses(accountId?: string): Observable<WalletAddress[]> {
    const endpoint = accountId
      ? `/custody/accounts/${accountId}/addresses`
      : '/custody/addresses';
    return this.apiService.get<WalletAddress[]>(endpoint);
  }

  /**
   * Generate new wallet address
   */
  generateWalletAddress(accountId: string, data: {
    network: string;
    label: string;
    type: 'deposit' | 'withdrawal' | 'both';
  }): Observable<WalletAddress> {
    return this.apiService.post<WalletAddress>(
      `/custody/accounts/${accountId}/addresses`,
      data
    );
  }

  // Reconciliation
  /**
   * Get reconciliation reports
   */
  getReconciliationReports(
    pagination: PaginationParams
  ): Observable<PaginatedResponse<ReconciliationReport>> {
    return this.apiService.getPaginated<ReconciliationReport>('/reconciliation/reports', pagination);
  }

  /**
   * Get reconciliation report by ID
   */
  getReconciliationReportById(reportId: string): Observable<ReconciliationReport> {
    return this.apiService.get<ReconciliationReport>(`/reconciliation/reports/${reportId}`);
  }

  /**
   * Create reconciliation report
   */
  createReconciliationReport(data: {
    startDate: Date;
    endDate: Date;
    assetIds?: string[];
  }): Observable<ReconciliationReport> {
    return this.apiService.post<ReconciliationReport>('/reconciliation/reports', data);
  }

  /**
   * Resolve discrepancy
   */
  resolveDiscrepancy(reportId: string, discrepancyId: string, reason: string): Observable<ReconciliationReport> {
    return this.apiService.post<ReconciliationReport>(
      `/reconciliation/reports/${reportId}/discrepancies/${discrepancyId}/resolve`,
      { reason }
    );
  }

  // Dashboard
  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.apiService.get<DashboardStats>('/dashboard/stats');
  }
}
