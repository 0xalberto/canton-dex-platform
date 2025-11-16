/**
 * Application-wide constants
 */

/**
 * Environment configuration
 */
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging',
} as const;

/**
 * API configuration
 */
export const API = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Authentication configuration
 */
export const AUTH = {
  TOKEN_KEY: 'accessToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  USER_KEY: 'user',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes before expiry
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  RECENT_SEARCHES: 'recentSearches',
  FAVORITES: 'favorites',
  SETTINGS: 'settings',
  CHART_SETTINGS: 'chartSettings',
  TRADING_PREFERENCES: 'tradingPreferences',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Date/Time formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
  ISO_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
  TIME_ONLY: 'HH:mm:ss',
  SHORT_TIME: 'HH:mm',
} as const;

/**
 * Trading constants
 */
export const TRADING = {
  ORDER_TYPES: ['market', 'limit', 'stop', 'stop_limit'] as const,
  ORDER_SIDES: ['buy', 'sell'] as const,
  ORDER_STATUSES: ['pending', 'open', 'filled', 'cancelled', 'rejected'] as const,
  POSITION_TYPES: ['long', 'short'] as const,
  TIME_IN_FORCE: ['GTC', 'IOC', 'FOK', 'DAY'] as const,

  // Limits
  MIN_ORDER_AMOUNT: 0.00000001,
  MAX_ORDER_AMOUNT: 1000000000,
  MIN_PRICE: 0.00000001,
  MAX_PRICE: 1000000000,
} as const;

/**
 * WebSocket configuration
 */
export const WEBSOCKET = {
  RECONNECT_INTERVAL: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 10,
  PING_INTERVAL: 30000, // 30 seconds
  PONG_TIMEOUT: 10000, // 10 seconds
} as const;

/**
 * Chart configuration
 */
export const CHART = {
  TIMEFRAMES: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'] as const,
  CHART_TYPES: ['candlestick', 'line', 'area', 'bar'] as const,
  INDICATORS: ['MA', 'EMA', 'RSI', 'MACD', 'BB', 'VOLUME'] as const,
  DEFAULT_TIMEFRAME: '1h',
  DEFAULT_CHART_TYPE: 'candlestick',
  MAX_CANDLES: 1000,
} as const;

/**
 * Validation rules
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_REGEX: /^[a-zA-Z0-9_-]+$/,
} as const;

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const;

/**
 * Notification settings
 */
export const NOTIFICATIONS = {
  DEFAULT_DURATION: 5000, // 5 seconds
  SUCCESS_DURATION: 3000, // 3 seconds
  ERROR_DURATION: 7000, // 7 seconds
  MAX_NOTIFICATIONS: 5,
} as const;

/**
 * Rate limiting
 */
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
} as const;

/**
 * Feature flags
 */
export const FEATURES = {
  ENABLE_WEBSOCKET: true,
  ENABLE_DARK_MODE: true,
  ENABLE_TRADING: true,
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_CHAT: false,
  ENABLE_REFERRALS: false,
} as const;

/**
 * Application metadata
 */
export const APP = {
  NAME: 'CantonDEX',
  VERSION: '1.0.0',
  DESCRIPTION: 'Distributed Exchange Platform',
  COMPANY: 'CantonDEX',
  SUPPORT_EMAIL: 'support@cantondex.com',
  WEBSITE: 'https://cantondex.com',
} as const;

/**
 * Social media links
 */
export const SOCIAL = {
  TWITTER: 'https://twitter.com/cantondex',
  DISCORD: 'https://discord.gg/cantondex',
  TELEGRAM: 'https://t.me/cantondex',
  GITHUB: 'https://github.com/cantondex',
  MEDIUM: 'https://medium.com/@cantondex',
} as const;

/**
 * Routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  TRADING: '/trading',
  PORTFOLIO: '/portfolio',
  WALLET: '/wallet',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  HELP: '/help',
} as const;

// Type exports
export type OrderType = typeof TRADING.ORDER_TYPES[number];
export type OrderSide = typeof TRADING.ORDER_SIDES[number];
export type OrderStatus = typeof TRADING.ORDER_STATUSES[number];
export type PositionType = typeof TRADING.POSITION_TYPES[number];
export type TimeInForce = typeof TRADING.TIME_IN_FORCE[number];
export type Timeframe = typeof CHART.TIMEFRAMES[number];
export type ChartType = typeof CHART.CHART_TYPES[number];
export type Indicator = typeof CHART.INDICATORS[number];
