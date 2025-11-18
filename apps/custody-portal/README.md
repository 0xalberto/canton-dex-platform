# Custody Portal - CantonDEX

Angular 17 application for managing cryptocurrency custody operations.

## Features

- **Dashboard**: Overview of custody assets, transactions, and key metrics
- **Asset Management**: Real-time asset balances with WebSocket updates
- **Withdrawals**: Multi-signature withdrawal approval workflow
- **Deposits**: Track and reconcile incoming deposits
- **Reconciliation**: Automated discrepancy detection and resolution

## Technology Stack

- **Angular 17**: Standalone components with modern Angular features
- **Angular Material**: Material Design UI components
- **NgRx**: State management with actions, reducers, and selectors
- **Socket.io**: Real-time WebSocket communication
- **Axios**: HTTP client (via API service wrapper)
- **TypeScript**: Strict mode enabled with path aliases

## Project Structure

```
src/
├── app/
│   ├── guards/           # Route guards (auth)
│   ├── interceptors/     # HTTP interceptors
│   ├── layout/           # Main layout with sidenav
│   ├── pages/            # Feature pages
│   │   ├── dashboard/
│   │   ├── assets/
│   │   ├── deposits/
│   │   ├── withdrawals/
│   │   ├── reconciliation/
│   │   └── login/
│   ├── services/         # Business services
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   ├── asset.service.ts
│   │   └── websocket.service.ts
│   ├── store/           # NgRx state management
│   │   ├── asset/       # Asset state
│   │   ├── custody/     # Custody state
│   │   └── app.state.ts
│   └── types/           # TypeScript interfaces
├── environments/        # Environment configurations
└── styles.scss         # Global styles

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Navigate to
http://localhost:4200
```

> **Note**: Backend API Gateway must be running at `http://localhost:8000` before starting the portal.

### Build

```bash
# Development build
npm run build

# Production build
npm run build -- --configuration production
```

### Testing

```bash
# Run unit tests
npm test

# Run linting
npm run lint
```

## Configuration

### Environment Variables

Edit `src/environments/environment.ts` and `src/environments/environment.production.ts`:

- `apiUrl`: Backend API URL
- `wsUrl`: WebSocket server URL
- `features`: Feature flags

### Path Aliases

The following TypeScript path aliases are configured:

- `@app/*` → `src/app/*`
- `@services/*` → `src/app/services/*`
- `@store/*` → `src/app/store/*`
- `@types/*` → `src/app/types/*`
- `@pages/*` → `src/app/pages/*`
- `@layout/*` → `src/app/layout/*`

## State Management

### Asset Store

- Manages asset balances and details
- Real-time updates via WebSocket
- Selectors for computed values

### Custody Store

- Transaction management (deposits, withdrawals)
- Pagination support
- Multi-signature approval tracking

## Authentication

- JWT-based authentication
- Token refresh mechanism
- Role-based permissions
- Route guards

## WebSocket Integration

Real-time updates for:
- Asset balance changes
- Transaction status updates
- Withdrawal approvals

## Development Guidelines

### Component Structure

All components use Angular 17 standalone components:
- No NgModules
- Direct imports in component metadata
- Tree-shakeable by default

### State Management Pattern

1. Components dispatch actions
2. Effects handle async operations (if needed)
3. Reducers update state
4. Selectors compute derived state
5. Components subscribe to observables

### Service Pattern

- `ApiService`: Generic HTTP operations
- Feature services: Business logic and API calls
- `WebSocketService`: Real-time communication
- `AuthService`: Authentication and authorization

## License

Proprietary - CantonDEX
