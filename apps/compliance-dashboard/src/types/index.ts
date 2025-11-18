// Common types for the Compliance Dashboard

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  ADMIN = 'admin',
  COMPLIANCE_OFFICER = 'compliance_officer',
  AUDITOR = 'auditor',
  VIEWER = 'viewer'
}

export interface AuditLog {
  id: string
  timestamp: string
  userId: string
  user: string
  action: string
  resource: string
  resourceId?: string
  severity: Severity
  metadata?: Record<string, unknown>
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Alert {
  id: string
  title: string
  description: string
  severity: Severity
  status: AlertStatus
  createdAt: string
  updatedAt: string
  assignedTo?: string
  metadata?: Record<string, unknown>
  rule?: string
  accountId?: string
}

export enum AlertStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export interface KYCRequest {
  id: string
  userId: string
  name: string
  email: string
  documentType: string
  status: KYCStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  notes?: string
}

export enum KYCStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  timestamp: string
  riskScore?: number
  flagged: boolean
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRADE = 'trade',
  TRANSFER = 'transfer'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface Report {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  dateRange: {
    start: string
    end: string
  }
  generatedAt: string
  generatedBy: string
  fileUrl?: string
}

export enum ReportType {
  TRANSACTION_SUMMARY = 'transaction_summary',
  KYC_STATUS = 'kyc_status',
  ALERT_SUMMARY = 'alert_summary',
  RISK_ASSESSMENT = 'risk_assessment',
  AUDIT_TRAIL = 'audit_trail'
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json'
}

export interface DashboardStats {
  activeAlerts: number
  pendingKyc: number
  transactionsToday: number
  riskScore: number
  flaggedTransactions: number
  activeUsers: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
