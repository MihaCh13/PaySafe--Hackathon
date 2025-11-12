# UniPay Architecture Overview

## System Architecture

UniPay is built as a modern single-page application (SPA) with clear separation between frontend and backend.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         React SPA (Port 5000)                     │  │
│  │  ┌─────────────┐  ┌──────────────┐              │  │
│  │  │   Routes    │  │  Components  │              │  │
│  │  │  (React     │  │  (shadcn/ui) │              │  │
│  │  │   Router)   │  │              │              │  │
│  │  └─────────────┘  └──────────────┘              │  │
│  │         │                  │                     │  │
│  │  ┌──────▼──────────────────▼───────┐            │  │
│  │  │    State Management              │            │  │
│  │  │  - Zustand (Client state)        │            │  │
│  │  │  - TanStack Query (Server state) │            │  │
│  │  └──────────────────────────────────┘            │  │
│  │         │                                         │  │
│  │  ┌──────▼──────────────────────────┐            │  │
│  │  │   API Client (Axios)             │            │  │
│  │  │   - JWT Token Interceptor        │            │  │
│  │  │   - Error Handling               │            │  │
│  │  └──────────────────────────────────┘            │  │
│  └───────────────────┬─────────────────────────────┘  │
└────────────────────┼─────────────────────────────────┘
                      │ HTTP/HTTPS
                      │ (JSON)
┌────────────────────▼─────────────────────────────────┐
│             Flask Backend (Port 8000)                 │
│  ┌───────────────────────────────────────────────┐  │
│  │         Flask Application Factory             │  │
│  │  ┌─────────────────────────────────────┐     │  │
│  │  │  Blueprints (Route Modules)         │     │  │
│  │  │  - /auth    - /wallet               │     │  │
│  │  │  - /cards   - /transactions         │     │  │
│  │  │  - /savings - /marketplace          │     │  │
│  │  │  - /loans                            │     │  │
│  │  └─────────────────────────────────────┘     │  │
│  │         │                                      │  │
│  │  ┌──────▼──────────────────────────┐          │  │
│  │  │  Middleware & Extensions        │          │  │
│  │  │  - JWT Authentication           │          │  │
│  │  │  - CORS                          │          │  │
│  │  │  - Database Session Management  │          │  │
│  │  └─────────────────────────────────┘          │  │
│  │         │                                      │  │
│  │  ┌──────▼──────────────────────────┐          │  │
│  │  │  SQLAlchemy ORM                 │          │  │
│  │  │  - Models                        │          │  │
│  │  │  - Relationships                 │          │  │
│  │  │  - Migrations (Alembic)         │          │  │
│  │  └─────────────────────────────────┘          │  │
│  └───────────────────┬───────────────────────────┘  │
└────────────────────┼─────────────────────────────┘
                      │
┌────────────────────▼─────────────────────────────────┐
│         PostgreSQL Database (Neon-backed)             │
│  ┌───────────────────────────────────────────────┐  │
│  │  Tables:                                       │  │
│  │  - users          - wallets                    │  │
│  │  - transactions   - virtual_cards              │  │
│  │  - subscriptions  - savings_pockets            │  │
│  │  - goals          - marketplace_listings       │  │
│  │  - marketplace_orders - loans                  │  │
│  │  - loan_repayments                             │  │
│  └───────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router DOM v6
- **State Management**:
  - Zustand (Client state - auth)
  - TanStack Query (Server state - data fetching)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Form Management**: React Hook Form
- **Validation**: Zod
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)

### Backend
- **Framework**: Flask (Python)
- **ORM**: SQLAlchemy with Flask-SQLAlchemy
- **Authentication**: Flask-JWT-Extended
- **Database Migrations**: Flask-Migrate (Alembic)
- **CORS**: Flask-CORS
- **Real-time** (Planned): Flask-SocketIO
- **Password Hashing**: Werkzeug

### Database
- **Type**: PostgreSQL
- **Provider**: Replit (Neon-backed)
- **Connection**: via DATABASE_URL environment variable

### Development Tools
- **Package Manager (Frontend)**: npm
- **Package Manager (Backend)**: pip
- **Linting (Frontend)**: ESLint
- **Type Checking**: TypeScript compiler

## Architecture Patterns

### Frontend Architecture

#### Component Structure
```
src/
├── components/        # Shared UI components
│   ├── ui/           # shadcn/ui components
│   └── layout/       # Layout components (Sidebar, TopNav)
├── features/          # Feature-based modules
│   ├── auth/         # Authentication
│   ├── wallet/       # Wallet management
│   ├── cards/        # Virtual cards
│   └── ...           # Other features
├── layouts/           # Page layouts
│   ├── AuthLayout.tsx
│   └── DashboardLayout.tsx
├── lib/               # Utilities and configurations
│   ├── api.ts        # API client
│   ├── utils.ts      # Helper functions
│   └── queryClient.ts # React Query config
├── store/             # State management
│   └── authStore.ts  # Zustand stores
└── App.tsx            # Root component with routing
```

#### State Management Strategy
- **Zustand**: Authentication state, UI state
- **TanStack Query**: Server data caching, automatic refetching
- **React State**: Local component state

### Backend Architecture

#### Application Factory Pattern
```python
def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(config or 'config.Config')
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(wallet_bp, url_prefix='/api/wallet')
    # ... other blueprints
    
    return app
```

#### Blueprint Organization
Each feature is a separate blueprint:
- **auth.py**: User registration, login, JWT
- **wallet.py**: Balance, top-up, transfers
- **cards.py**: Virtual card management
- **transactions.py**: Transaction history
- **savings.py**: DarkDays Pocket, Goals
- **marketplace.py**: Student marketplace
- **loans.py**: P2P lending

## Security Architecture

### Authentication Flow
```
1. User Login
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT token
   ↓
4. Return token to frontend
   ↓
5. Frontend stores in localStorage
   ↓
6. Axios interceptor attaches to requests
   ↓
7. Backend verifies token on protected routes
```

### Security Measures
- JWT-based authentication
- Password hashing (bcrypt via Werkzeug)
- PIN protection for sensitive operations
- CORS configuration
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection (React escapes by default)
- CSRF protection (JWT stateless)

### Authentication & Query Management (Updated Nov 8, 2025)

**Infinite Redirect Loop Prevention:**

The application implements safeguards to prevent infinite redirect loops that can occur when unauthenticated API calls trigger repeated redirects:

1. **Axios Response Interceptor** (`src/lib/api.ts`):
   ```typescript
   let isRedirecting = false;
   
   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       if (error.response?.status === 401 && !isRedirecting) {
         isRedirecting = true;
         localStorage.removeItem('access_token');
         localStorage.removeItem('refresh_token');
         localStorage.removeItem('auth-storage');
         setTimeout(() => window.location.replace('/login'), 100);
       }
       return Promise.reject(error);
     }
   );
   ```
   - `isRedirecting` flag prevents duplicate redirects
   - Clears all authentication data (including Zustand persisted state)
   - Uses `window.location.replace()` for clean navigation

2. **React Query Configuration** (`src/lib/queryClient.ts`):
   ```typescript
   retry: (failureCount, error: any) => {
     if (error?.response?.status === 401) return false;
     return failureCount < 1;
   }
   ```
   - Never retry on 401 errors (authentication failures)
   - Limit other retries to maximum 1 attempt

3. **Query Gating Pattern**:
   ```typescript
   const { data } = useQuery({
     queryKey: ['wallet'],
     queryFn: async () => await walletAPI.getWallet(),
     enabled: isAuthenticated, // Only run when authenticated
   });
   ```
   - All dashboard queries use `enabled: isAuthenticated` flag
   - Prevents API calls before authentication state is confirmed
   - Eliminates race conditions between auth check and data fetching

## Data Flow

### Typical Request Flow
```
User Action (React Component)
    ↓
Trigger mutation/query (TanStack Query)
    ↓
API call via Axios (lib/api.ts)
    ↓
Interceptor adds JWT token
    ↓
Flask route handler (Blueprint)
    ↓
@jwt_required() decorator validates token
    ↓
Business logic execution
    ↓
Database operations (SQLAlchemy)
    ↓
Response formatted
    ↓
Return JSON to frontend
    ↓
TanStack Query updates cache
    ↓
React component re-renders
```

## Deployment Architecture

### Development
- Backend: `python run.py` (port 8000)
- Frontend: `npm run dev` (port 5000)
- Vite proxy: `/api` → `http://localhost:8000`

### Production (Planned)
- Backend: Gunicorn WSGI server
- Frontend: Static build served via CDN
- Database: Production PostgreSQL
- SSL/TLS: HTTPS everywhere
- Load balancing: Multiple backend instances

## Scalability Considerations

### Current State
- Single server architecture
- Synchronous request handling
- In-memory session storage (JWT)

### Future Improvements
- [ ] Horizontal scaling with load balancer
- [ ] Redis for session management
- [ ] Background job processing (Celery)
- [ ] CDN for static assets
- [ ] Database read replicas
- [ ] Microservices architecture (if needed)
- [ ] WebSocket server for real-time features
