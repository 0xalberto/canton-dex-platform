// User types
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KYCStatus;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  partyId?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  TRADER = 'TRADER',
  VIEWER = 'VIEWER',
  COMPLIANCE = 'COMPLIANCE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  DISABLED = 'DISABLED',
}

export enum KYCStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// Trading Pair types
export interface TradingPair {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  symbol: string;
  status: TradingPairStatus;
  minOrderSize: string;
  maxOrderSize: string;
  priceIncrement: string;
  quantityIncrement: string;
  createdAt: string;
  updatedAt: string;
}

export enum TradingPairStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  HALTED = 'HALTED',
}

// Fee Configuration types
export interface FeeConfig {
  id: string;
  tradingPairId?: string;
  userRole?: UserRole;
  makerFee: string;
  takerFee: string;
  withdrawalFee: string;
  depositFee: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// System Health types
export interface SystemHealth {
  status: HealthStatus;
  services: ServiceHealth[];
  lastChecked: string;
}

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  uptime: number;
  lastError?: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
  UNKNOWN = 'UNKNOWN',
}

// Canton Domain types
export interface CantonDomain {
  id: string;
  name: string;
  status: DomainStatus;
  participantId: string;
  connectedParticipants: number;
  lastSyncAt?: string;
  createdAt: string;
}

export enum DomainStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SYNCING = 'SYNCING',
  ERROR = 'ERROR',
}

export interface CantonParticipant {
  id: string;
  name: string;
  status: ParticipantStatus;
  domains: string[];
  ledgerId: string;
  createdAt: string;
}

export enum ParticipantStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  SYNCING = 'SYNCING',
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalVolume24h: string;
  totalTrades24h: number;
  systemHealth: HealthStatus;
  activeTradingPairs: number;
}
