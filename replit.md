# UniPay - Smart Student Digital Wallet

## Overview
UniPay is a digital wallet application for students, integrating financial services with lifestyle features. It provides secure digital payments, subscription management, student discounts, savings goal tracking, and peer-to-peer lending and marketplace functionalities. UniPay aims to be an essential financial tool, offering convenience, security, customized benefits, and fostering financial literacy and independence.

## User Preferences
No specific user preferences recorded yet. This section will be updated as development progresses.

## System Architecture

UniPay is structured as a single-page application (SPA) with a clear separation between its backend and frontend components.

### UI/UX Decisions
The frontend features a modern, Revolut-inspired interface, built with `shadcn/ui` (Radix UI, Tailwind CSS). Key design elements include a fixed top navigation, a fully responsive collapsible left sidebar, a modern color palette with violet/indigo gradients and pastel accents, card-based layouts, Framer Motion for animations, and a gradient balance card with quick action buttons. `DashboardLayout` is used for authenticated users and `AuthLayout` for unauthenticated users.

**Branding:**
*   **Logo:** Modern icon-based logo depicting a digital wallet with student theme, stored at `public/assets/logo.png`.
*   **Text Styling:** "UniPay" text uses a gradient (`from-[#9b87f5] via-[#7DD3FC] to-[#60C5E8]`) matching the logo's lavender-to-cyan color palette, extrabold font weight, tight tracking, and subtle drop shadow.

**Key UI/UX Features:**
*   **Responsive Collapsible Sidebar:** Universally available, responsive widths, touch-friendly controls, smooth Framer Motion animations, persistent state via Zustand, and full accessibility.
*   **Dialog/Popup Scrolling Pattern:** Standardized scrollable pattern for all dialogs.
*   **Consistent Transaction Color Coding:** Green for incoming/balance increases, red/danger for outgoing/balance decreases.
*   **Dashboard Balance Card:** Premium digital bank card design with authentic 7:4 aspect ratio, enhanced maximum width, percent-based positioning, proportionally scaling typography, action buttons, layered shadows, diagonal gradient background with glassmorphic overlays, animated shimmer effect, EMV chip and wallet branding icons, and responsive blur effects.
*   **Activity/Transactions Page Layout:** Responsive two-column grid for large screens; stacked layout for mobile/tablet.
*   **Comprehensive Fluid Design System:** Fully responsive design using `CSS clamp()` for seamless scaling of typography, spacing, and components.
*   **Centralized Animation System:** Production-ready animation library (`src/lib/animations.ts`) with reusable Framer Motion variants and interaction helpers, respecting `prefers-reduced-motion`.

### Technical Implementations
*   **Backend:** Flask (Python), SQLAlchemy (PostgreSQL), Flask-JWT-Extended for authentication, Flask-SocketIO for real-time features. Utilizes an Application Factory Pattern and Flask Blueprints for modularity, with security measures like JWT, password hashing, PIN protection, and CORS.
*   **Frontend:** React 18 and Vite. State management via Zustand (client-side) and TanStack Query (server-side). Axios for HTTP requests with JWT interceptors, and React Router DOM for navigation.

**Core Feature Specifications:**
*   **Authentication:** User registration, login with password visibility, JWT token management, PIN setup/change.
*   **Wallet:** Balance display, top-up, peer-to-peer transfers, multi-currency support, transfer scheduling, and secure QR code payment system.
*   **QR Code Payments:** Secure payment initiation via QR codes using `itsdangerous` signed tokens (5-minute expiry).
*   **Transactions:** Comprehensive tracking, filtering, and statistical analysis for 15+ types, including "expected payments", balance validation, race condition protection, and automatic query invalidation.
    - **IMPORTANT: Scheduled Transaction Design Pattern** - For scheduled/upcoming transactions (subscriptions, expected payments), the `created_at` field represents the **billing/due date**, NOT the creation timestamp. This allows calendar filtering by billing date. The frontend compensates by fetching a wider date range (current month ± 1-3 months) to ensure all relevant scheduled transactions are included in queries.
    - **Finance Timeline Calendar** - The calendar displays upcoming payments in yellow by fetching data from three sources: 
      - Regular transactions (via `/api/transactions` with extended date range: month-1 to month+3)
      - Expected payments (via `/api/expected-payments`, filtered to future dates only)
      - Active subscriptions (via `/api/subscriptions?status=active`, extracting `next_billing_date` from each subscription)
      - All upcoming items are marked with `status: 'scheduled'` and `is_upcoming: true` to ensure proper color coding
      - Date grouping uses local timezone (YYYY-MM-DD format) to avoid timezone-related mismatches between transaction dates and calendar cells
      - DayDetailModal uses matching local timezone key to retrieve transactions for clicked dates
      - Implementation filters expected payments to exclude past/completed entries (date >= today)
*   **Virtual Cards:** Creation, management (freeze/unfreeze), linking to subscriptions, and payment checks.
*   **Subscriptions:** Management of recurring payments with automatic upcoming payment scheduling.
    - **Subscription Scheduler Service** (`backend/app/services/subscription_scheduler.py`) - Centralized service for managing subscription payment scheduling:
      - `ensure_next_payment()`: Generates next subscription payment within horizon (default 31 days ahead)
      - `sync_all_active()`: Syncs all active subscriptions to ensure upcoming payments exist
      - `process_payment_completion()`: Post-payment hook that updates subscription dates and schedules next payment
      - Idempotent design prevents duplicate scheduled transactions
    - **Payment Lifecycle**: When subscription payment is processed → transaction marked as completed → next month's payment automatically scheduled → calendar shows upcoming payment in yellow
    - **Calendar Display**: Fetches transactions with wide date range (month - 1 to month + 3) to capture all upcoming scheduled payments (due to created_at design pattern)
    - **IMPORTANT**: To see upcoming payments in calendar, user must have active subscriptions with `next_billing_date` set, then call `/api/cards/subscriptions/sync-upcoming` endpoint to generate scheduled transactions
*   **Savings & Goals:** Dedicated goal tracking with progress indicators, contributions, editable targets, and completion celebrations.
*   **DarkDays Pocket:** Secure, PIN-protected savings pockets with auto-save options and emergency withdrawal.
*   **Marketplace:** Student-to-student commerce with listings and escrow services.
*   **P2P Lending:** Request-approval system with distinct tabs, approval workflow, loan lifecycle tracking, role-based actions, visual indicators, and robust security.
*   **ISIC Discounts:** Integration for student card-based discounts.
*   **Security Settings:** PIN management, visual-only features for email verification, 2FA, active sessions, rate limiting, and session timeout.
*   **Notifications:** Comprehensive notification system with persistent bell icon badge, Zustand store with localStorage persistence, toast notifications for all financial actions (transfers, top-ups, budget card spending), and currency-aware notification helpers that format amounts based on user's selected currency.
*   **Budget Cards:** Redesigned with user-friendly three-value structure for immediate understanding:
    - **Left**: Initial Budget Loaded (total deposited)
    - **Center**: Amount Spent with red emphasis box
    - **Right**: Remaining Balance (emphasized in green)
    - Symmetrical layout with clear numerical values visible at a glance
    - Thin progress bar below as optional visual indicator (0%-100% with percentage used)
    - Full multi-currency support throughout
    - Consistent layout across both "All" and "Budget" tabs
    - Automatic query invalidation ensures Dashboard Recent Transactions displays all transaction types including budget card payments
*   **Budget Cards & Payment Cards Section:** Complete redesign with compact, consistent card tiles across all tabs:
    - **Reusable Card Components**: Created `renderMainWalletCard()`, `renderPaymentCard()`, and `renderBudgetCard()` functions for consistency
    - **Main Wallet Card** (appears in ALL tabs):
      - Violet-cyan gradient (#9b87f5 → #7DD3FC → #60C5E8) matching app's signature branding
      - Displays primary balance and masked ID number
      - Compact 180px height with tight spacing (p-4, text-xs, h-8 buttons)
    - **Payment Cards** (One-Time & Standard):
      - Orange gradient (#F97316 → #FB923C) for One-Time cards
      - Purple gradient (#8B5CF6 → #A78BFA) for Standard Digital cards
      - Uppercase card type labels, masked card numbers, frozen status badges
      - Consistent 180px height with compact layout
    - **Budget & Subscription Cards**:
      - **Structured Flexbox Layout**: Full-height flex column layout ensures consistent vertical alignment across all cards
      - **Fixed Height Header**: min-h-[60px] header section accommodates 1-2 line card names with line-clamp-2 constraint
      - Prominent green gradient "Available Balance" box showing remaining_balance in large text
      - Financial overview row: Total Budget (allocated_amount) left, Spent (spent_amount) right in red
      - Green→Yellow→Red progress bar based on spending percentage (<50% green, <80% yellow, ≥80% red)
      - **Action Buttons (Redesigned 2-Row Layout with Fixed Positioning)**:
        - Fixed footer section with top border separator (pt-4 border-t)
        - Row 1: "Add Funds" (green gradient) and "Spend" (orange-red gradient) side-by-side
        - Row 2: "View Details" (violet outline) spanning full width
        - Color-coded gradients: Green for funding actions, orange-red for spending, violet for secondary actions
        - Enhanced readability with font-medium, larger icons (h-4 w-4), and proper spacing
        - Buttons maintain consistent vertical position regardless of card name length
        - Improved visual hierarchy with primary actions (row 1) and secondary actions (row 2)
      - **Perfect Grid Alignment**: All cards align at top with consistent spacing between all internal elements
      - Subscription cards behave identically to budget cards with full financial tracking (allocated_amount, spent_amount, remaining_balance, spent_percentage)
      - Backend VirtualCard model supports financial methods (get_remaining_balance, get_spent_percentage) for both budget and subscription purposes
    - **Tab Consistency & Accurate Counters**: 
      - All tab: Main Wallet Card + Payment Cards + Budget Cards + Subscription Cards
      - Payment tab: Main Wallet Card + Payment Cards only
      - Budget tab: Budget Cards only (main wallet and payment cards removed)
      - Subscription tab: Subscription Cards only (main wallet and payment cards removed)
      - Tab counters accurately reflect displayed cards in each category
    - **No Excessive White Space**: Fixed height (h-[180px]), reduced padding (p-3/p-4), smaller buttons (h-7/h-8), compact text (text-xs/text-sm)

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