// Authentication Types
export interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  kycStatus: 'basic' | 'enhanced' | 'full'
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

// Account Types
export interface Account {
  id: string
  userId: string
  accountType: 'individual' | 'business'
  balance: Record<string, number>
  lockedBalance: Record<string, number>
  marginUsed: number
  marginAvailable: number
  marginLevel: number
  status: 'active' | 'suspended' | 'closed'
  createdAt: string
}

// Asset Types
export interface Asset {
  symbol: string
  name: string
  decimals: number
  balance: number
  locked: number
  valueUsd: number
  available: number
}

// Order Types
export type OrderType = 'market' | 'limit' | 'stop' | 'iceberg'
export type OrderSide = 'buy' | 'sell'
export type OrderStatus = 'pending' | 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected'
export type TimeInForce = 'gtc' | 'ioc' | 'fok' | 'gtd'

export interface Order {
  id: string
  userId: string
  pair: string
  side: OrderSide
  type: OrderType
  quantity: number
  price: number | null
  filledQuantity: number
  status: OrderStatus
  timeInForce: TimeInForce
  createdAt: string
  updatedAt: string
}

export interface PlaceOrderRequest {
  pair: string
  side: OrderSide
  type: OrderType
  quantity: number
  price?: number
  stopPrice?: number
  timeInForce: TimeInForce
  clientOrderId?: string
}

// Trade Types
export interface Trade {
  id: string
  orderId: string
  pair: string
  side: OrderSide
  quantity: number
  price: number
  fee: number
  feeCurrency: string
  totalValue: number
  createdAt: string
}

// Market Data Types
export interface MarketPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  minOrderSize: number
  maxOrderSize: number
  tickSize: number
  status: 'active' | 'inactive' | 'maintenance'
}

export interface Ticker {
  symbol: string
  lastPrice: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  quoteVolume24h: number
  bid: number
  ask: number
}

export interface OrderBook {
  symbol: string
  timestamp: number
  bids: Array<[number, number]> // [price, quantity]
  asks: Array<[number, number]>
}

export interface Trade {
  id: string
  pair: string
  side: OrderSide
  quantity: number
  price: number
  timestamp: number
}

// Chart Types
export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'

// WebSocket Message Types
export interface WSMessage {
  event: string
  data: any
  timestamp: number
}

export type WSEventType =
  | 'order_created'
  | 'order_filled'
  | 'order_cancelled'
  | 'trade_executed'
  | 'ticker_update'
  | 'orderbook_update'
  | 'position_update'

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  username: string
  acceptTerms: boolean
}

export interface DepositFormData {
  asset: string
  amount: number
}

export interface WithdrawFormData {
  asset: string
  amount: number
  address: string
}

// Notification Types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: number
  read: boolean
}
