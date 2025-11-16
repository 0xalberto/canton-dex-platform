# @cantondex/api-client

Shared API client for CantonDEX applications built with Axios.

## Installation

```bash
pnpm add @cantondex/api-client
```

## Setup

Configure the API client at the start of your application:

```typescript
import { configureAPIClient, setupInterceptors } from '@cantondex/api-client';

// Configure the client
const client = configureAPIClient({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  withCredentials: true,

  // Function to get auth token
  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  // Handle unauthorized errors
  onUnauthorized: () => {
    // Clear auth state and redirect to login
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  },

  // Global error handler
  onError: (error) => {
    console.error('API Error:', error);
    // Show toast notification, etc.
  }
});

// Setup interceptors
setupInterceptors(client, {
  baseURL: process.env.VITE_API_URL || 'http://localhost:3000/api',
  getToken: () => localStorage.getItem('accessToken'),
  onUnauthorized: () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }
});
```

## Usage

### Basic HTTP Methods

```typescript
import { get, post, put, patch, del } from '@cantondex/api-client';

// GET request
const users = await get('/users');
const user = await get('/users/123');

// POST request
const newUser = await post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const updatedUser = await put('/users/123', {
  name: 'Jane Doe'
});

// PATCH request
const patchedUser = await patch('/users/123', {
  email: 'jane@example.com'
});

// DELETE request
await del('/users/123');
```

### Using Endpoints

```typescript
import { get, post, ENDPOINTS } from '@cantondex/api-client';

// Login
const response = await post(ENDPOINTS.AUTH.LOGIN, {
  email: 'user@example.com',
  password: 'password'
});

// Get current user
const user = await get(ENDPOINTS.AUTH.ME);

// Get user by ID
const userData = await get(ENDPOINTS.USERS.GET('user-123'));

// List orders
const orders = await get(ENDPOINTS.TRADING.ORDERS.LIST);

// Create order
const order = await post(ENDPOINTS.TRADING.ORDERS.CREATE, {
  symbol: 'BTC/USDT',
  type: 'limit',
  side: 'buy',
  amount: 0.1,
  price: 50000
});
```

### Building URLs with Query Parameters

```typescript
import { buildURL, get, ENDPOINTS } from '@cantondex/api-client';

// Build URL with query params
const url = buildURL(ENDPOINTS.TRADING.ORDERS.LIST, {
  status: 'open',
  page: 1,
  limit: 20
});

const orders = await get(url);
// GET /trading/orders?status=open&page=1&limit=20
```

### Using Direct Client

```typescript
import { getAPIClient } from '@cantondex/api-client';

const client = getAPIClient();

// Use Axios directly
const response = await client.get('/users', {
  params: { page: 1, limit: 10 }
});

// With custom config
const response = await client.post('/users', data, {
  headers: {
    'Custom-Header': 'value'
  },
  timeout: 5000
});
```

### TypeScript Support

```typescript
import { get, post, type User, type PaginatedResponse } from '@cantondex/api-client';

// Type-safe requests
const user = await get<User>('/users/123');
const users = await get<PaginatedResponse<User>>('/users');

interface CreateUserData {
  name: string;
  email: string;
}

const newUser = await post<User>('/users', {
  name: 'John',
  email: 'john@example.com'
} as CreateUserData);
```

### Error Handling

```typescript
import { get, type APIError } from '@cantondex/api-client';

try {
  const data = await get('/users/123');
} catch (error) {
  const apiError = error as APIError;

  console.log(apiError.message); // Error message
  console.log(apiError.statusCode); // HTTP status code
  console.log(apiError.code); // Custom error code
  console.log(apiError.errors); // Validation errors
}
```

## Advanced Features

### Request Retry

```typescript
import { getAPIClient, createRetryInterceptor } from '@cantondex/api-client';

const client = getAPIClient();

// Add retry interceptor (max 3 retries, 1 second delay)
createRetryInterceptor(client, 3, 1000);

// Requests will automatically retry on failure
const data = await get('/users');
```

### Request Logging

```typescript
import { getAPIClient, createLoggingInterceptor } from '@cantondex/api-client';

const client = getAPIClient();

// Add logging interceptor for debugging
createLoggingInterceptor(client);

// All requests and responses will be logged to console
const data = await get('/users');
```

### Response Caching

```typescript
import { getAPIClient, createCacheInterceptor } from '@cantondex/api-client';

const client = getAPIClient();

// Add cache interceptor (5 minute cache)
createCacheInterceptor(client, 5 * 60 * 1000);

// GET requests will be cached
const data = await get('/users'); // Makes API call
const cachedData = await get('/users'); // Returns cached data
```

### Custom Interceptors

```typescript
import { getAPIClient } from '@cantondex/api-client';

const client = getAPIClient();

// Request interceptor
client.interceptors.request.use(
  (config) => {
    // Add custom header
    config.headers['X-Custom-Header'] = 'value';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
client.interceptors.response.use(
  (response) => {
    // Transform response data
    return response;
  },
  (error) => {
    // Handle specific errors
    if (error.response?.status === 403) {
      // Handle forbidden
    }
    return Promise.reject(error);
  }
);
```

## Available Endpoints

### Authentication
- `ENDPOINTS.AUTH.LOGIN` - `/auth/login`
- `ENDPOINTS.AUTH.REGISTER` - `/auth/register`
- `ENDPOINTS.AUTH.LOGOUT` - `/auth/logout`
- `ENDPOINTS.AUTH.REFRESH` - `/auth/refresh`
- `ENDPOINTS.AUTH.ME` - `/auth/me`

### Users
- `ENDPOINTS.USERS.LIST` - `/users`
- `ENDPOINTS.USERS.GET(id)` - `/users/:id`
- `ENDPOINTS.USERS.CREATE` - `/users`
- `ENDPOINTS.USERS.UPDATE(id)` - `/users/:id`
- `ENDPOINTS.USERS.DELETE(id)` - `/users/:id`

### Trading
- `ENDPOINTS.TRADING.ORDERS.LIST` - `/trading/orders`
- `ENDPOINTS.TRADING.ORDERS.CREATE` - `/trading/orders`
- `ENDPOINTS.TRADING.POSITIONS.LIST` - `/trading/positions`
- `ENDPOINTS.TRADING.MARKETS.LIST` - `/trading/markets`
- `ENDPOINTS.TRADING.MARKETS.TICKER(symbol)` - `/trading/markets/:symbol/ticker`

### Wallet
- `ENDPOINTS.WALLET.BALANCES` - `/wallet/balances`
- `ENDPOINTS.WALLET.TRANSACTIONS` - `/wallet/transactions`
- `ENDPOINTS.WALLET.DEPOSIT` - `/wallet/deposit`
- `ENDPOINTS.WALLET.WITHDRAW` - `/wallet/withdraw`

### Analytics
- `ENDPOINTS.ANALYTICS.DASHBOARD` - `/analytics/dashboard`
- `ENDPOINTS.ANALYTICS.PORTFOLIO` - `/analytics/portfolio`
- `ENDPOINTS.ANALYTICS.PERFORMANCE` - `/analytics/performance`

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
