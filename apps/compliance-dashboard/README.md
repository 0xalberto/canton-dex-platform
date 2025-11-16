# CantonDEX Compliance Dashboard

A Vue.js-based compliance dashboard for monitoring KYC, audit logs, surveillance, and generating compliance reports.

## Features

- Real-time compliance monitoring
- KYC management
- Audit log tracking
- Market surveillance
- Report generation
- Role-based access control

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Vuetify** - Material Design component framework
- **Pinia** - State management
- **Vue Router** - Routing
- **Axios** - HTTP client
- **Socket.io** - Real-time updates
- **Tailwind CSS** - Utility-first CSS
- **Vitest** - Unit testing

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

### Development

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:3003
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Project Structure

```
compliance-dashboard/
├── src/
│   ├── components/     # Reusable Vue components
│   ├── pages/          # Page components
│   ├── router/         # Vue Router configuration
│   ├── stores/         # Pinia stores
│   ├── services/       # API and WebSocket services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.vue         # Root component
│   ├── main.ts         # Application entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Available Routes

- `/` - Dashboard overview
- `/audit-log` - Audit log viewer
- `/surveillance` - Market surveillance
- `/kyc` - KYC management
- `/reports` - Report generation

## Environment Variables

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket server URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

## Contributing

Please follow the project's coding standards and submit pull requests for review.

## License

Private - CantonDEX
