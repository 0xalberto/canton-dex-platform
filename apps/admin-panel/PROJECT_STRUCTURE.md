# Admin Panel Project Structure

```
apps/admin-panel/
├── Configuration Files
│   ├── package.json                 # Dependencies and scripts
│   ├── next.config.js              # Next.js configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── tailwind.config.ts          # Tailwind CSS configuration
│   ├── postcss.config.js           # PostCSS configuration
│   ├── .eslintrc.json             # ESLint configuration
│   ├── .env.example               # Environment variables template
│   ├── .gitignore                 # Git ignore rules
│   └── middleware.ts              # Next.js middleware (auth)
│
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Root page (redirects to login)
│   │
│   ├── (auth)/                    # Auth route group
│   │   ├── layout.tsx            # Auth layout
│   │   └── login/
│   │       └── page.tsx          # Login page
│   │
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── layout.tsx            # Dashboard layout (with Navbar/Sidebar)
│   │   ├── users/
│   │   │   ├── page.tsx          # User management page
│   │   │   └── [id]/
│   │   │       └── page.tsx      # User detail page
│   │   ├── trading-pairs/
│   │   │   └── page.tsx          # Trading pairs config page
│   │   ├── fees/
│   │   │   └── page.tsx          # Fee configuration page
│   │   ├── system-health/
│   │   │   └── page.tsx          # System health monitoring
│   │   └── canton-management/
│   │       └── page.tsx          # Canton management page
│   │
│   └── api/                      # API Routes
│       ├── auth/login/
│       │   └── route.ts          # Login endpoint
│       ├── users/
│       │   └── route.ts          # Users CRUD API
│       └── trading-pairs/
│           └── route.ts          # Trading pairs API
│
├── components/                    # React Components
│   ├── ui/                       # UI Primitives (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── badge.tsx
│   │   └── table.tsx
│   ├── Navbar.tsx                # Top navigation bar
│   ├── Sidebar.tsx               # Side navigation
│   ├── UserTable.tsx             # User data table
│   ├── HealthStatus.tsx          # System health display
│   └── StatsCard.tsx             # Statistics card component
│
├── lib/                          # Utilities & Libraries
│   ├── api.ts                    # API client (Axios)
│   ├── auth.ts                   # Auth utilities
│   ├── store.ts                  # Zustand state stores
│   └── utils.ts                  # Helper functions
│
├── types/                        # TypeScript Types
│   └── index.ts                  # Shared type definitions
│
├── styles/                       # Styling
│   └── globals.css               # Global CSS with Tailwind
│
├── public/                       # Static Assets
│
├── README.md                     # Project documentation
└── next-env.d.ts                # Next.js TypeScript types
```

## Key Features Implemented

### 1. Authentication System
- Login page with form validation
- JWT token management
- Protected routes via middleware
- Auth state management with Zustand

### 2. User Management
- User list with search functionality
- User detail pages
- Role and status badges
- KYC status tracking

### 3. Trading Pairs Configuration
- List all trading pairs
- Status indicators
- Min/max order sizes
- CRUD operations

### 4. Fee Configuration
- Maker/Taker fees
- Withdrawal/Deposit fees
- Role-based fee configs
- Trading pair specific fees

### 5. System Health Monitoring
- Real-time health status
- Service monitoring
- Auto-refresh every 30 seconds
- Health status indicators

### 6. Canton Management
- Domain monitoring
- Participant tracking
- Connection status
- Ledger information

## Tech Stack

- **Next.js 14**: App Router, Server Components, Route Handlers
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality UI components
- **Zustand**: Lightweight state management
- **Axios**: HTTP client with interceptors
- **Lucide React**: Icon library
- **Radix UI**: Accessible component primitives

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment:
   ```bash
   cp .env.example .env
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Access at: http://localhost:3001

## Demo Credentials

- Email: admin@cantondex.com
- Password: admin123
