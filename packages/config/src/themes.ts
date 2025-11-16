import { colors } from './colors';

/**
 * Light theme configuration
 */
export const lightTheme = {
  name: 'light',
  colors: {
    primary: colors.brand.primary,
    secondary: colors.brand.secondary,
    accent: colors.brand.accent,
    background: {
      default: '#FFFFFF',
      paper: '#F9FAFB',
      elevated: '#FFFFFF',
      muted: '#F3F4F6',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      muted: '#9CA3AF',
      disabled: '#D1D5DB',
    },
    border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
      dark: '#9CA3AF',
    },
    status: colors.status,
    trading: colors.trading,
  },
} as const;

/**
 * Dark theme configuration
 */
export const darkTheme = {
  name: 'dark',
  colors: {
    primary: colors.brand.primary,
    secondary: colors.brand.secondary,
    accent: colors.brand.accent,
    background: {
      default: '#111827',
      paper: '#1F2937',
      elevated: '#374151',
      muted: '#1F2937',
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#D1D5DB',
      muted: '#9CA3AF',
      disabled: '#6B7280',
    },
    border: {
      light: '#374151',
      medium: '#4B5563',
      dark: '#6B7280',
    },
    status: colors.status,
    trading: colors.trading,
  },
} as const;

/**
 * Theme configuration type
 */
export type Theme = typeof lightTheme | typeof darkTheme;

/**
 * Available themes
 */
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

/**
 * Default theme
 */
export const defaultTheme = lightTheme;

/**
 * CSS variables for theme integration
 */
export const themeToCSSVariables = (theme: Theme): Record<string, string> => {
  return {
    // Primary colors
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-accent': theme.colors.accent,

    // Background colors
    '--color-bg-default': theme.colors.background.default,
    '--color-bg-paper': theme.colors.background.paper,
    '--color-bg-elevated': theme.colors.background.elevated,
    '--color-bg-muted': theme.colors.background.muted,

    // Text colors
    '--color-text-primary': theme.colors.text.primary,
    '--color-text-secondary': theme.colors.text.secondary,
    '--color-text-muted': theme.colors.text.muted,
    '--color-text-disabled': theme.colors.text.disabled,

    // Border colors
    '--color-border-light': theme.colors.border.light,
    '--color-border-medium': theme.colors.border.medium,
    '--color-border-dark': theme.colors.border.dark,

    // Status colors
    '--color-success': theme.colors.status.success,
    '--color-warning': theme.colors.status.warning,
    '--color-error': theme.colors.status.error,
    '--color-info': theme.colors.status.info,

    // Trading colors
    '--color-buy': theme.colors.trading.buy,
    '--color-sell': theme.colors.trading.sell,
    '--color-profit': theme.colors.trading.profit,
    '--color-loss': theme.colors.trading.loss,
  };
};

/**
 * Apply theme to document
 */
export const applyTheme = (theme: Theme): void => {
  if (typeof document === 'undefined') return;

  const variables = themeToCSSVariables(theme);
  const root = document.documentElement;

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.setAttribute('data-theme', theme.name);
};

/**
 * Get theme by name
 */
export const getThemeByName = (name: 'light' | 'dark'): Theme => {
  return themes[name] || defaultTheme;
};
