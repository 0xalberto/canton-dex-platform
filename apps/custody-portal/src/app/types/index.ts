// Asset Types
export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  availableBalance: string;
  lockedBalance: string;
  usdValue: number;
  changePercent24h: number;
  lastUpdated: Date;
}

export interface AssetDetail extends Asset {
  network: string;
  contractAddress?: string;
  decimals: number;
  totalSupply?: string;
  circulatingSupply?: string;
}

// Custody Types
export interface CustodyAccount {
  id: string;
  name: string;
  type: 'hot' | 'warm' | 'cold';
  status: 'active' | 'inactive' | 'frozen';
  assets: Asset[];
  createdAt: Date;
  lastActivity: Date;
}

export interface WalletAddress {
  id: string;
  address: string;
  network: string;
  label: string;
  type: 'deposit' | 'withdrawal' | 'both';
  status: 'active' | 'inactive';
  createdAt: Date;
}

// Transaction Types
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  status: 'pending' | 'confirming' | 'completed' | 'failed' | 'cancelled';
  assetId: string;
  assetSymbol: string;
  amount: string;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
  network: string;
  confirmations: number;
  requiredConfirmations: number;
  fee?: string;
  createdAt: Date;
  completedAt?: Date;
  initiatedBy: string;
}

export interface Deposit extends Transaction {
  type: 'deposit';
  creditedAt?: Date;
  reconciled: boolean;
}

export interface Withdrawal extends Transaction {
  type: 'withdrawal';
  approvals: Approval[];
  requiredApprovals: number;
  requestedBy: string;
}

export interface Approval {
  userId: string;
  userName: string;
  approvedAt: Date;
  signature?: string;
}

// Reconciliation Types
export interface ReconciliationReport {
  id: string;
  startDate: Date;
  endDate: Date;
  status: 'in_progress' | 'completed' | 'failed';
  totalAssets: number;
  reconciledAssets: number;
  discrepancies: Discrepancy[];
  createdAt: Date;
  completedAt?: Date;
}

export interface Discrepancy {
  id: string;
  assetId: string;
  assetSymbol: string;
  expectedBalance: string;
  actualBalance: string;
  difference: string;
  reason?: string;
  resolved: boolean;
}

// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'auditor' | 'viewer';
  permissions: Permission[];
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
}

export type Permission =
  | 'view_assets'
  | 'manage_assets'
  | 'view_transactions'
  | 'approve_withdrawals'
  | 'initiate_withdrawals'
  | 'manage_addresses'
  | 'view_reconciliation'
  | 'manage_reconciliation'
  | 'manage_users';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

// WebSocket Types
export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
}

export interface BalanceUpdate {
  assetId: string;
  balance: string;
  availableBalance: string;
  lockedBalance: string;
}

export interface TransactionUpdate {
  transactionId: string;
  status: Transaction['status'];
  confirmations: number;
  txHash?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalAssets: number;
  totalValueUsd: number;
  change24h: number;
  activeTransactions: number;
  pendingWithdrawals: number;
  recentActivity: Transaction[];
}

// Filter & Query Types
export interface TransactionFilter {
  type?: Transaction['type'];
  status?: Transaction['status'];
  assetId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
