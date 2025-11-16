# @cantondex/config

Shared configuration package for CantonDEX applications including colors, themes, constants, and Tailwind config.

## Installation

```bash
pnpm add @cantondex/config
```

## Usage

### Colors

```typescript
import { colors, colorUtils } from '@cantondex/config';

// Use brand colors
const primaryColor = colors.brand.primary; // #3B82F6

// Use neutral colors
const grayColor = colors.neutral[500]; // #6B7280

// Use status colors
const successColor = colors.status.success; // #10B981

// Use trading colors
const buyColor = colors.trading.buy; // #10B981
const sellColor = colors.trading.sell; // #EF4444

// Use gradients
const primaryGradient = colors.gradients.primary;

// Color utilities
const rgb = colorUtils.hexToRgb('#3B82F6');
// { r: 59, g: 130, b: 246 }

const rgba = colorUtils.hexToRgba('#3B82F6', 0.5);
// rgba(59, 130, 246, 0.5)

const contrastText = colorUtils.getContrastText('#3B82F6');
// #FFFFFF (white for dark backgrounds)
```

### Themes

```typescript
import { themes, applyTheme, getThemeByName, themeToCSSVariables } from '@cantondex/config';

// Get theme
const lightTheme = themes.light;
const darkTheme = themes.dark;

// Apply theme to document
applyTheme(darkTheme);

// Get theme by name
const theme = getThemeByName('dark');

// Convert theme to CSS variables
const cssVars = themeToCSSVariables(lightTheme);
// {
//   '--color-primary': '#3B82F6',
//   '--color-bg-default': '#FFFFFF',
//   ...
// }

// Use in React component
function App() {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    const theme = getThemeByName(currentTheme);
    applyTheme(theme);
  }, [currentTheme]);

  return (
    <button onClick={() => setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

### Constants

```typescript
import {
  API,
  AUTH,
  STORAGE_KEYS,
  PAGINATION,
  TRADING,
  CHART,
  VALIDATION,
  ROUTES,
  APP
} from '@cantondex/config';

// API constants
const timeout = API.TIMEOUT; // 30000
const retries = API.RETRY_ATTEMPTS; // 3

// Auth constants
const tokenKey = AUTH.TOKEN_KEY; // 'accessToken'

// Storage keys
const themeKey = STORAGE_KEYS.THEME; // 'theme'

// Pagination
const defaultPage = PAGINATION.DEFAULT_PAGE; // 1
const pageSize = PAGINATION.DEFAULT_PAGE_SIZE; // 10

// Trading
const orderTypes = TRADING.ORDER_TYPES; // ['market', 'limit', 'stop', 'stop_limit']
const orderSides = TRADING.ORDER_SIDES; // ['buy', 'sell']

// Chart
const timeframes = CHART.TIMEFRAMES; // ['1m', '5m', '15m', ...]
const defaultTimeframe = CHART.DEFAULT_TIMEFRAME; // '1h'

// Validation
const emailRegex = VALIDATION.EMAIL_REGEX;
const minPasswordLength = VALIDATION.PASSWORD_MIN_LENGTH; // 8

// Routes
const loginRoute = ROUTES.LOGIN; // '/login'
const dashboardRoute = ROUTES.DASHBOARD; // '/dashboard'

// App metadata
const appName = APP.NAME; // 'CantonDEX'
const appVersion = APP.VERSION; // '1.0.0'
```

### TypeScript Types

```typescript
import type {
  OrderType,
  OrderSide,
  OrderStatus,
  Timeframe,
  ChartType,
  Theme,
  ColorPalette
} from '@cantondex/config';

// Use types in your code
const orderType: OrderType = 'limit';
const orderSide: OrderSide = 'buy';
const timeframe: Timeframe = '1h';

// Type-safe theme
const theme: Theme = {
  name: 'custom',
  colors: {
    // ... theme colors
  }
};
```

### Tailwind Configuration

Extend the base Tailwind config in your application:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import baseConfig from '@cantondex/config/tailwind';

const config: Config = {
  ...baseConfig,
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@cantondex/shared-ui/dist/**/*.{js,mjs}',
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme?.extend,
      // Your custom extensions
    },
  },
};

export default config;
```

## Available Constants

### API
- `TIMEOUT` - API timeout (30000ms)
- `RETRY_ATTEMPTS` - Max retry attempts (3)
- `RETRY_DELAY` - Delay between retries (1000ms)
- `CACHE_DURATION` - Cache duration (5 minutes)

### AUTH
- `TOKEN_KEY` - Access token storage key
- `REFRESH_TOKEN_KEY` - Refresh token storage key
- `USER_KEY` - User data storage key
- `TOKEN_EXPIRY_BUFFER` - Token expiry buffer (5 minutes)

### PAGINATION
- `DEFAULT_PAGE` - Default page number (1)
- `DEFAULT_PAGE_SIZE` - Default items per page (10)
- `PAGE_SIZE_OPTIONS` - Available page sizes [10, 20, 50, 100]
- `MAX_PAGE_SIZE` - Maximum page size (100)

### TRADING
- `ORDER_TYPES` - Available order types
- `ORDER_SIDES` - Order sides (buy/sell)
- `ORDER_STATUSES` - Order statuses
- `POSITION_TYPES` - Position types (long/short)
- `TIME_IN_FORCE` - Time in force options
- `MIN_ORDER_AMOUNT` - Minimum order amount
- `MAX_ORDER_AMOUNT` - Maximum order amount

### CHART
- `TIMEFRAMES` - Available chart timeframes
- `CHART_TYPES` - Available chart types
- `INDICATORS` - Available technical indicators
- `DEFAULT_TIMEFRAME` - Default timeframe ('1h')
- `DEFAULT_CHART_TYPE` - Default chart type ('candlestick')
- `MAX_CANDLES` - Maximum candles to display (1000)

### VALIDATION
- `EMAIL_REGEX` - Email validation regex
- `PASSWORD_MIN_LENGTH` - Minimum password length (8)
- `PASSWORD_MAX_LENGTH` - Maximum password length (128)
- `USERNAME_MIN_LENGTH` - Minimum username length (3)
- `USERNAME_MAX_LENGTH` - Maximum username length (30)
- `USERNAME_REGEX` - Username validation regex

## Color Palette

### Brand Colors
- `primary` - #3B82F6 (Blue)
- `secondary` - #8B5CF6 (Purple)
- `accent` - #10B981 (Green)
- `warning` - #F59E0B (Amber)
- `danger` - #EF4444 (Red)
- `info` - #06B6D4 (Cyan)

### Status Colors
- `success` - #10B981
- `warning` - #F59E0B
- `error` - #EF4444
- `info` - #06B6D4

### Trading Colors
- `buy` / `long` / `profit` - #10B981 (Green)
- `sell` / `short` / `loss` - #EF4444 (Red)

### Neutral Colors
50-950 shades of gray from lightest to darkest

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Watch mode for development
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint
```

## License

MIT
