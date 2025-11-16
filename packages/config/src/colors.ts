/**
 * Shared color palette for CantonDEX applications
 */

export const colors = {
  // Brand colors
  brand: {
    primary: '#3B82F6', // Blue
    secondary: '#8B5CF6', // Purple
    accent: '#10B981', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    info: '#06B6D4', // Cyan
  },

  // Neutral colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',
  },

  // Trading colors
  trading: {
    buy: '#10B981', // Green
    sell: '#EF4444', // Red
    long: '#10B981',
    short: '#EF4444',
    profit: '#10B981',
    loss: '#EF4444',
  },

  // Chart colors
  chart: {
    bullish: '#10B981',
    bearish: '#EF4444',
    volume: '#6B7280',
    grid: '#E5E7EB',
    crosshair: '#9CA3AF',
    annotation: '#3B82F6',
  },

  // Background colors
  background: {
    light: '#FFFFFF',
    dark: '#111827',
    muted: '#F3F4F6',
    elevated: '#FFFFFF',
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
  },

  // Border colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },

  // Gradient colors
  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    dark: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
  },

  // Social/Platform colors
  social: {
    twitter: '#1DA1F2',
    discord: '#5865F2',
    telegram: '#0088CC',
    github: '#181717',
  },
} as const;

/**
 * Color utilities
 */
export const colorUtils = {
  /**
   * Convert hex color to RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * Convert hex color to RGBA
   */
  hexToRgba: (hex: string, alpha: number = 1): string => {
    const rgb = colorUtils.hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex;
  },

  /**
   * Get contrasting text color (black or white) based on background
   */
  getContrastText: (hexColor: string): string => {
    const rgb = colorUtils.hexToRgb(hexColor);
    if (!rgb) return '#000000';

    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  },
};

export type ColorPalette = typeof colors;
export type BrandColors = typeof colors.brand;
export type NeutralColors = typeof colors.neutral;
export type StatusColors = typeof colors.status;
export type TradingColors = typeof colors.trading;
