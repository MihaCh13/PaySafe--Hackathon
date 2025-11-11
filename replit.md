# UniPay - Smart Student Digital Wallet

## Overview
UniPay is a digital wallet application designed for students, integrating financial services with lifestyle features. Its core purpose is to provide secure digital payments, subscription management, student discounts, savings goal tracking, and peer-to-peer lending and marketplace functionalities. UniPay aims to be an essential financial tool, offering convenience, security, customized benefits, and fostering financial literacy and independence.

## Recent Changes
**November 11, 2025 - Budget Cards/Subscriptions Calendar Integration & Duplicate Prevention**
- **Upcoming Payment Calendar Display**: When a subscription is added to a budget card, the system automatically creates a scheduled transaction (status='scheduled') for the next billing date
- **Yellow Calendar Markers**: Scheduled subscription payments appear in the Activity calendar with yellow color (#FACC15) for easy visual identification of upcoming payments
- **Smart Lifecycle Management**: Scheduled transactions are automatically managed - created on subscription add, deleted on subscription pause/delete, recreated on subscription resume
- **Duplicate Prevention - Backend**: 409 conflict error prevents adding the same subscription service twice to a card (checks service_name + is_active)
- **Duplicate Prevention - Frontend**: "Add Subscription" button automatically disables and shows "Already Added" text for services already subscribed
- **Immediate Calendar Sync**: All subscription mutations invalidate transactions query, ensuring calendar updates instantly without page refresh
- **Transaction Integration**: Scheduled subscription payments use transaction_source='budget_card' and transaction_type='subscription_payment' for complete tracking consistency

**November 11, 2025 - Comprehensive Transaction Source Tracking Implemented**
- **Database Schema**: Added `transaction_source` field to Transaction model with enum values: 'main_wallet', 'dark_days', 'budget_card'
- **Backend Coverage**: Updated ALL 21 transaction creation endpoints across 7 blueprints (savings, cards, wallet, loans, marketplace, subscriptions, expected_payments) to populate transaction_source
- **Transaction Source Assignment**: Dark Days deposits/withdrawals → 'dark_days', Budget Card allocations/spends → 'budget_card', all other transactions → 'main_wallet'
- **Frontend Filtering**: Implemented layered account-type filtering UI in CollapsibleTransactionList with Account Type buttons (Main Account, Dark Days, Budget Cards) that work in combination with income/expense filters
- **Transaction Categorization**: Updated type helpers to include all 19 transaction types (added: loan_cancelled_refund, subscription_payment, loan_cancelled_return)
- **Card Number Safety**: Enhanced virtual card number generation with collision detection, retry logic, and timestamp-based fallback
- **Bug Fixes**: Fixed subscriptions.py bug using incorrect field name 'type' instead of 'transaction_type'
- **Backward Compatibility**: Proper fallback handling for legacy transactions without transaction_source (defaults to 'main_wallet')
- **Validation**: Application tested end-to-end with no backend/frontend errors, all API endpoints responding correctly

**November 10, 2025 - Comprehensive Test Data Seeders Created**
- Created comprehensive seeder for StudentKlombaTest@test.com account with full feature coverage
- Populated test data across all modules: Transfers, Budget Cards, Goals, Dark Days Pocket, Marketplace, Loans
- Created extended user seeder for 19 total test accounts with transaction history
- Generated 85 historical transactions spanning 6 months across multiple accounts
- Seeded 61 merchant partners for ISIC discounts
- All test accounts use password: "password123" and PIN: "1234"

**November 10, 2025 - GitHub Import Complete**
- Successfully imported full codebase from https://github.com/MihaCh13/PaySafe--Hackathon
- Configured Replit environment with Node.js 20 and Python 3.11
- Set up PostgreSQL database with DATABASE_URL environment variable
- Configured development workflow to run both backend (Flask on localhost:8000) and frontend (Vite on 0.0.0.0:5000)
- Frontend properly configured with allowedHosts: true for Replit proxy support
- Deployment configured for autoscale deployment target
- Application running successfully with login page accessible

## User Preferences
No specific user preferences recorded yet. This section will be updated as development progresses.

## System Architecture

UniPay is structured as a single-page application (SPA) with a clear separation between its backend and frontend components.

### UI/UX Decisions
The frontend features a modern, Revolut-inspired interface, built with `shadcn/ui` (Radix UI, Tailwind CSS). Key design elements include a fixed top navigation, a fully responsive collapsible left sidebar, a modern color palette with violet/indigo gradients and pastel accents, card-based layouts, Framer Motion for animations, and a gradient balance card with quick action buttons. `DashboardLayout` is used for authenticated users and `AuthLayout` for unauthenticated users.

**Key UI/UX Features:**
*   **Responsive Collapsible Sidebar:** Universally available on the left, edge-to-edge layout, responsive widths using `clamp()`, touch-friendly controls, smooth Framer Motion animations, persistent state via Zustand, and full accessibility.
*   **Dialog/Popup Scrolling Pattern:** Standardized scrollable pattern for all dialogs to ensure proper viewport fitting (`max-h-[90vh]`, `overflow-y-auto`).
*   **Consistent Transaction Color Coding:** Universal color system for transaction icons and amounts across all views (Dashboard Recent Transactions, Transactions Page, Calendar Day Details, Transfer History, Collapsible Transaction List): incoming transactions/balance increases use green icons (ArrowDownLeft) with bg-success-light/text-success-hover, outgoing transactions/balance decreases use red/danger icons (ArrowUpRight) with bg-danger-light/text-danger-hover. This consistent visual language helps users quickly identify transaction direction at a glance.
*   **Dashboard Balance Card:** Premium digital bank card design with authentic 7:4 aspect ratio (matching real bank cards), enhanced maximum width (52rem vs 42rem) for better presence on large monitors, strict boundary containment preventing all overflow and clipping, fully percent-based positioning system for consistent scaling across all screen sizes, proportionally scaling typography with increased maximums for large screens (balance: clamp(1.5rem, 5vw, 4rem), labels: clamp(0.625rem, 1.8vw, 1.125rem), buttons: clamp(0.625rem, 1.75vw, 1rem)), text elements (balance label, amount, currency) perfectly centered vertically and horizontally with overflow protection (ellipsis truncation), action buttons (Top Up, Transfer, Cards) anchored to bottom with proportional spacing and text truncation, enhanced depth with layered shadows (light and ambient), diagonal gradient background with glassmorphic overlays, subtle decorative elements (blur orbs positioned inward to account for blur spread, SVG patterns inset from edges), animated shimmer effect respecting reduced motion preferences, EMV chip and wallet branding icons with increased max dimensions (2rem vs 1.5rem) for large screens, responsive blur effects using clamp(), flex-shrink controls to prevent button overflow, and all internal elements scaling proportionally based on card dimensions while maintaining clean boundaries and professional appearance on desktop (1920px+), laptop (1440px), tablet (768px), and mobile (320px) devices.
*   **Activity/Transactions Page Layout:** Responsive layout with two-column grid for large screens (lg breakpoint) where calendar (3fr width) and vertically centered statistics cards (Total Income, Total Expenses, Transactions count at 2fr width using lg:justify-center and h-full) sit side-by-side in the top row, and All Transactions dropdown spans full width below the grid. Mobile and tablet devices maintain traditional stacked layout with horizontal statistics cards at top, followed by calendar, and full-width transactions list below.
*   **Comprehensive Fluid Design System:** Fully responsive design using `CSS clamp()` for seamless scaling of typography (e.g., `text-h1` to `text-h6` and `text-display`), spacing, and components across all viewport sizes (320px-1440px), eliminating breakpoint-specific overrides and ensuring consistent visual language. All animations respect `prefers-reduced-motion`.

### Technical Implementations
*   **Backend:** Flask (Python), SQLAlchemy (PostgreSQL), Flask-JWT-Extended for authentication, Flask-SocketIO for real-time features. Utilizes an Application Factory Pattern and Flask Blueprints for modularity, with security measures like JWT, password hashing, PIN protection, and CORS.
*   **Frontend:** React 18 and Vite. State management via Zustand (client-side) and TanStack Query (server-side). Axios for HTTP requests with JWT interceptors, and React Router DOM for navigation.

**Core Feature Specifications:**
*   **Authentication:** User registration, login, JWT token management, PIN setup/change, and visual-only features for forgot password and social login.
*   **Wallet:** Balance display, top-up with immediate transaction recording and UI updates across all views (Dashboard Recent Transactions, Activity/Transactions page), peer-to-peer transfers, and multi-currency support with transfer scheduling.
*   **Transactions:** Comprehensive tracking, filtering, and statistical analysis for 15+ types, including "expected payments" (CRUD, recurring), balance validation, race condition protection, detailed records, and automatic query invalidation ensuring immediate visibility of new transactions across Dashboard Recent Transactions and Activity sections after wallet operations (top-up, transfer, etc.).
*   **Virtual Cards:** Creation, management (freeze/unfreeze), linking to subscriptions, and payment checks.
*   **Subscriptions:** Management of recurring payments.
*   **Savings & Goals:** Dedicated goal tracking with progress indicators, contributions, editable targets, and completion celebrations.
*   **DarkDays Pocket:** Secure, PIN-protected savings pockets with auto-save options, consolidated settings, and emergency withdrawal flow with security verification.
*   **Marketplace:** Student-to-student commerce with listings and escrow services, buyer balance validation, and dual transaction recording.
*   **P2P Lending:** Request-approval system with distinct tabs ("Pending Requests," "My Requests," "I Owe," "Owed to Me"), approval workflow, summary statistics, full loan lifecycle tracking, role-based actions, visual indicators, and robust security including balance validation and race condition protection.
*   **ISIC Discounts:** Integration for student card-based discounts.
*   **Security Settings:** PIN management (with default PIN detection and password-verified change), visual-only features for email verification, 2FA, active sessions, rate limiting, and session timeout.
*   **Notifications:** Comprehensive toast notification system and optimized UI dialogs for various screen sizes.

### System Design Choices
*   **Database Schema:** Core entities include Users, Wallets, Transactions, VirtualCards, Subscriptions, SavingsPockets, Goals, Marketplace (Listings, Orders), Loans, Repayments, and ISIC models.
*   **API Design:** RESTful API with logically organized endpoints and proper HTTP status codes.
*   **Development Workflow:** Supports concurrent backend (Python) and frontend (Node.js) development with API proxying. Flask-Migrate (Alembic) for database migrations.

## External Dependencies

*   **Database:** PostgreSQL
*   **Backend Framework:** Flask
*   **Frontend Framework:** React 18
*   **Authentication:** Flask-JWT-Extended
*   **Real-time Communication:** Flask-SocketIO
*   **ORM:** SQLAlchemy with Flask-SQLAlchemy
*   **Database Migrations:** Flask-Migrate (Alembic)
*   **CORS Management:** Flask-CORS
*   **Frontend Build Tool:** Vite
*   **Routing:** React Router DOM
*   **State Management:** Zustand, TanStack Query
*   **HTTP Client:** Axios
*   **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
*   **Form Management & Validation:** React Hook Form, Zod
*   **Animations:** Framer Motion
*   **Date Calculations:** `python-dateutil`