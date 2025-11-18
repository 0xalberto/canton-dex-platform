/**
 * CantonDEX API Service
 * Connects frontend to real PostgreSQL-backed trading service
 */

const TRADING_API_BASE = import.meta.env.VITE_TRADING_SERVICE_URL || 'http://localhost:8000';
const AUTH_API_BASE = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4000/auth';

// ============================================
// TYPES
// ============================================

export interface Account {
  account_id: string;
  party_id: string;
  custodian_party_id: string | null;
  account_status: string;
  created_at: string;
}

export interface Balance {
  asset_symbol: string;
  available: string;
  locked: string;
  total: string;
}

export interface Order {
  order_id: string;
  pair: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'STOP';
  quantity: string;
  price: string | null;
  filled_quantity: string;
  remaining_quantity: string;
  status: string;
  created_at: string;
}

export interface Trade {
  trade_id: string;
  pair: string;
  quantity: string;
  price: string;
  maker_side: string;
  matched_at: string;
  settlement_status: string;
}

export interface OrderBookLevel {
  price: string;
  quantity: string;
  order_count: number;
}

export interface OrderBook {
  pair: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  updated_at: string;
}

export interface MarketData {
  pair: string;
  last_price: string | null;
  best_bid: string | null;
  best_ask: string | null;
  spread: string | null;
  price_change_24h: string | null;
  high_24h: string | null;
  low_24h: string | null;
  volume_24h: string | null;
}

// ============================================
// API CLIENT
// ============================================

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ============================================
// TRADING API
// ============================================

export class TradingAPI {
  private client: APIClient;

  constructor() {
    this.client = new APIClient(TRADING_API_BASE);
  }

  // Health check
  async health(): Promise<{ status: string; matching_engine: string; trades_matched: number }> {
    return this.client.get('/health');
  }

  // Account Management
  async createAccount(partyId: string, displayName: string, email?: string): Promise<Account> {
    return this.client.post('/accounts', {
      party_id: partyId,
      display_name: displayName,
      email,
    });
  }

  async getAccount(partyId: string): Promise<Account> {
    return this.client.get(`/accounts/${partyId}`);
  }

  async getBalances(partyId: string): Promise<Balance[]> {
    return this.client.get(`/accounts/${partyId}/balances`);
  }

  // Deposits & Withdrawals
  async deposit(accountId: string, assetSymbol: string, amount: number): Promise<{ success: boolean; transaction_id: string }> {
    return this.client.post('/deposit', {
      account_id: accountId,
      asset_symbol: assetSymbol,
      amount,
    });
  }

  async withdraw(
    accountId: string,
    assetSymbol: string,
    amount: number,
    destinationAddress: string
  ): Promise<{ success: boolean; transaction_id: string }> {
    return this.client.post('/withdraw', {
      account_id: accountId,
      asset_symbol: assetSymbol,
      amount,
      destination_address: destinationAddress,
    });
  }

  // Order Management
  async createOrder(
    accountId: string,
    pair: string,
    side: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT' | 'STOP',
    quantity: number,
    price?: number,
    stopPrice?: number
  ): Promise<Order> {
    return this.client.post('/orders', {
      account_id: accountId,
      pair,
      side,
      order_type: orderType,
      quantity,
      price,
      stop_price: stopPrice,
    });
  }

  async getOrders(partyId: string, status?: string): Promise<Order[]> {
    const endpoint = status
      ? `/orders/${partyId}?status=${status}`
      : `/orders/${partyId}`;
    return this.client.get(endpoint);
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; order_id: string }> {
    return this.client.delete(`/orders/${orderId}`);
  }

  // Market Data
  async getOrderBook(pair: string, depth: number = 20): Promise<OrderBook> {
    return this.client.get(`/orderbook/${pair}?depth=${depth}`);
  }

  async getMarketData(pair: string): Promise<MarketData> {
    return this.client.get(`/market/${pair}`);
  }

  async getAllMarkets(): Promise<MarketData[]> {
    return this.client.get('/markets');
  }

  async getTrades(pair: string, limit: number = 50): Promise<Trade[]> {
    return this.client.get(`/trades/${pair}?limit=${limit}`);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const tradingAPI = new TradingAPI();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format balance for display
 */
export function formatBalance(balance: string | number): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  } else {
    return num.toFixed(6);
  }
}

/**
 * Format price for display
 */
export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Calculate USD value
 */
export function calculateUSDValue(quantity: string, price: string): string {
  const qty = parseFloat(quantity);
  const prc = parseFloat(price);
  return formatPrice(qty * prc);
}

/**
 * Parse trading pair
 */
export function parsePair(pair: string): { base: string; quote: string } {
  const [base, quote] = pair.split('/');
  return { base, quote };
}
