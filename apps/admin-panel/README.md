# CantonDEX Admin Control Panel

A modern administrative control panel for managing the CantonDEX trading platform, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **User Management**: View, edit, and manage user accounts with KYC status tracking
- **Trading Pairs Configuration**: Configure and manage trading pairs with real-time status
- **Fee Management**: Set and manage trading, withdrawal, and deposit fees
- **System Health Monitoring**: Real-time monitoring of system services and health
- **Canton Management**: Monitor Canton domains and participants
- **Authentication**: Secure admin authentication with role-based access control

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update environment variables in `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

### Build

Build the application for production:

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Project Structure

```
apps/admin-panel/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication routes (group)
│   │   ├── login/           # Login page
│   │   └── layout.tsx       # Auth layout
│   ├── (dashboard)/         # Dashboard routes (group)
│   │   ├── users/           # User management
│   │   ├── trading-pairs/   # Trading pairs config
│   │   ├── fees/            # Fee configuration
│   │   ├── system-health/   # System health monitoring
│   │   ├── canton-management/ # Canton domain management
│   │   └── layout.tsx       # Dashboard layout
│   ├── api/                 # API routes
│   │   ├── auth/login/      # Login endpoint
│   │   ├── users/           # Users API
│   │   └── trading-pairs/   # Trading pairs API
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Root page (redirects)
├── components/              # React components
│   ├── ui/                  # UI primitives (shadcn)
│   ├── Navbar.tsx           # Navigation bar
│   ├── Sidebar.tsx          # Sidebar navigation
│   ├── UserTable.tsx        # User table component
│   ├── HealthStatus.tsx     # Health status display
│   └── StatsCard.tsx        # Statistics card
├── lib/                     # Utilities and libraries
│   ├── api.ts              # API client
│   ├── auth.ts             # Authentication utilities
│   ├── store.ts            # Zustand stores
│   └── utils.ts            # Utility functions
├── types/                   # TypeScript type definitions
│   └── index.ts            # Shared types
├── styles/                  # Global styles
│   └── globals.css         # Global CSS with Tailwind
├── public/                  # Static assets
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── package.json            # Dependencies and scripts
```

## Key Routes

### Authentication
- `/login` - Admin login page

### Dashboard
- `/users` - User management
- `/users/[id]` - User detail page
- `/trading-pairs` - Trading pairs configuration
- `/fees` - Fee configuration
- `/system-health` - System health monitoring
- `/canton-management` - Canton domain and participant management

## API Integration

The admin panel communicates with the CantonDEX backend API. Configure the API URL in your environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### API Endpoints Used

- `POST /api/auth/login` - Admin authentication
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/trading-pairs` - List trading pairs
- `POST /api/admin/trading-pairs` - Create trading pair
- `GET /api/admin/fees` - List fee configurations
- `GET /api/admin/system-health` - Get system health
- `GET /api/admin/canton/domains` - List Canton domains
- `GET /api/admin/canton/participants` - List Canton participants

## Development Notes

### Mock Data

The current implementation includes mock data for development purposes. Replace the mock API routes with actual backend integrations:

- `/app/api/auth/login/route.ts`
- `/app/api/users/route.ts`
- `/app/api/trading-pairs/route.ts`

### Authentication

Default demo credentials:
- Email: `admin@cantondex.com`
- Password: `admin123`

Replace the mock authentication with your actual authentication system.

### State Management

The application uses Zustand for state management. Key stores:

- `useAuthStore` - Authentication state
- `useDashboardStore` - Dashboard data and stats
- `useUIStore` - UI state (sidebar, theme)

## Security Considerations

1. **Authentication**: Implement proper JWT validation
2. **Authorization**: Add role-based access control (RBAC)
3. **API Security**: Use HTTPS in production
4. **CORS**: Configure proper CORS policies
5. **Rate Limiting**: Implement rate limiting on API routes
6. **Input Validation**: Validate all user inputs
7. **XSS Protection**: Sanitize user-generated content

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t cantondex-admin .
docker run -p 3001:3001 cantondex-admin
```

## Contributing

1. Follow the existing code style
2. Use TypeScript strict mode
3. Add proper type definitions
4. Test all features before committing
5. Update documentation as needed

## License

Private - CantonDEX Project
