/**
 * API endpoint definitions
 * Centralized location for all API endpoints
 */

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Users
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },

  // Trading
  TRADING: {
    ORDERS: {
      LIST: '/trading/orders',
      GET: (id: string) => `/trading/orders/${id}`,
      CREATE: '/trading/orders',
      CANCEL: (id: string) => `/trading/orders/${id}/cancel`,
      HISTORY: '/trading/orders/history',
    },
    POSITIONS: {
      LIST: '/trading/positions',
      GET: (id: string) => `/trading/positions/${id}`,
      CLOSE: (id: string) => `/trading/positions/${id}/close`,
    },
    MARKETS: {
      LIST: '/trading/markets',
      GET: (symbol: string) => `/trading/markets/${symbol}`,
      TICKER: (symbol: string) => `/trading/markets/${symbol}/ticker`,
      ORDERBOOK: (symbol: string) => `/trading/markets/${symbol}/orderbook`,
      TRADES: (symbol: string) => `/trading/markets/${symbol}/trades`,
      CANDLES: (symbol: string) => `/trading/markets/${symbol}/candles`,
    },
  },

  // Wallet
  WALLET: {
    BALANCES: '/wallet/balances',
    TRANSACTIONS: '/wallet/transactions',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    ADDRESSES: '/wallet/addresses',
    GENERATE_ADDRESS: '/wallet/addresses/generate',
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PORTFOLIO: '/analytics/portfolio',
    PERFORMANCE: '/analytics/performance',
    REPORTS: '/analytics/reports',
  },

  // Settings
  SETTINGS: {
    GET: '/settings',
    UPDATE: '/settings',
    NOTIFICATIONS: '/settings/notifications',
    SECURITY: '/settings/security',
    API_KEYS: '/settings/api-keys',
  },
} as const;

/**
 * Helper function to build query string from params
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Helper function to build URL with params
 */
export function buildURL(
  endpoint: string,
  params?: Record<string, any>
): string {
  if (!params) return endpoint;
  return `${endpoint}${buildQueryString(params)}`;
}
