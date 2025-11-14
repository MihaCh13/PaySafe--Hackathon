# UniPay - Smart Student Digital Wallet

## Overview
UniPay is a digital wallet application designed for students, integrating financial services with lifestyle features. Its core purpose is to provide secure digital payments, subscription management, student discounts, savings goal tracking, and peer-to-peer lending and marketplace functionalities. UniPay aims to be an essential financial tool, offering convenience, security, customized benefits, and fostering financial literacy and independence.

## User Preferences
No specific user preferences recorded yet. This section will be updated as development progresses.

## System Architecture

UniPay is structured as a single-page application (SPA) with a clear separation between its backend and frontend components.

### UI/UX Decisions
The frontend features a modern, Revolut-inspired interface, built with `shadcn/ui` (Radix UI, Tailwind CSS). Key design elements include a fixed top navigation, a fully responsive collapsible left sidebar, a modern color palette with violet/indigo gradients and pastel accents, card-based layouts, Framer Motion for animations, and a gradient balance card with quick action buttons. `DashboardLayout` is used for authenticated users and `AuthLayout` for unauthenticated users.

**Branding:**
*   **Logo:** Modern icon-based logo depicting a digital wallet with student theme, stored at `public/assets/logo.png`. The logo features a sleek wallet design with subtle banknotes visible inside and a graduation cap symbol on the front. Colors use the platform's signature lavender-to-cyan gradient. This is a pure graphic icon with no text, designed to sit alongside the "UniPay" text name. 
    
    **Logo Specifications:**
    *   **Text Styling:** "UniPay" text uses a beautiful gradient (`from-[#9b87f5] via-[#7DD3FC] to-[#60C5E8]`) matching the logo's lavender-to-cyan color palette, extrabold font weight, tight tracking, and subtle drop shadow for high contrast and readability
    *   **TopNav:** Logo (h-12 to h-16 responsive) + gradient text (text-xl to text-2xl)
    *   **Sidebar:** When expanded - Logo (h-10 to h-11) + gradient text (text-lg to text-xl), clickable link to dashboard; When collapsed - Only collapse/expand button visible (no logo or text)
    *   **Login Page:** Logo (h-20 w-20) + gradient text (text-3xl)
    *   **Register Page:** Logo (h-20 w-20) + gradient text (text-3xl)
    *   All implementations use `object-contain` for proper aspect ratio preservation, include smooth Framer Motion hover effects, and maintain accessibility with proper alt text. **Last updated:** November 14, 2025.

**Key UI/UX Features:**
*   **Responsive Collapsible Sidebar:** Universally available, responsive widths, touch-friendly controls, smooth Framer Motion animations, persistent state via Zustand, and full accessibility.
*   **Dialog/Popup Scrolling Pattern:** Standardized scrollable pattern for all dialogs to ensure proper viewport fitting.
*   **Consistent Transaction Color Coding:** Universal color system for transaction icons and amounts across all views: incoming transactions/balance increases use green icons, outgoing transactions/balance decreases use red/danger icons.
*   **Dashboard Balance Card:** Premium digital bank card design with authentic 7:4 aspect ratio, enhanced maximum width, strict boundary containment, fully percent-based positioning, proportionally scaling typography, action buttons anchored to bottom with proportional spacing, enhanced depth with layered shadows, diagonal gradient background with glassmorphic overlays, subtle decorative elements, animated shimmer effect, EMV chip and wallet branding icons, and responsive blur effects.
*   **Activity/Transactions Page Layout:** Responsive layout with two-column grid for large screens where calendar and vertically centered statistics cards sit side-by-side in the top row, and All Transactions dropdown spans full width below. Mobile and tablet devices maintain a stacked layout.
*   **Comprehensive Fluid Design System:** Fully responsive design using `CSS clamp()` for seamless scaling of typography, spacing, and components across all viewport sizes, eliminating breakpoint-specific overrides and ensuring consistent visual language. All animations respect `prefers-reduced-motion`.
*   **Centralized Animation System:** Production-ready animation library (`src/lib/animations.ts`) with reusable Framer Motion variants (staggerContainer, fadeUp, scaleIn, slideIn, listItem, shimmer) and interaction helpers (hoverScale, tapScale, buttonSpring). Core accessibility function `resolveMotion(variants, shouldReduceMotion)` automatically strips transform animations to opacity-only when users prefer reduced motion. Reusable wrapper components (`AnimatedSection`, `AnimatedDiv`, `MotionCard`, `AnimatedCard`) ensure consistent timing, easing, and WCAG compliance across all pages. Implemented on Budget Cards page as reference pattern. **Last updated:** November 14, 2025.

### Technical Implementations
*   **Backend:** Flask (Python), SQLAlchemy (PostgreSQL), Flask-JWT-Extended for authentication, Flask-SocketIO for real-time features. Utilizes an Application Factory Pattern and Flask Blueprints for modularity, with security measures like JWT, password hashing, PIN protection, and CORS.
*   **Frontend:** React 18 and Vite. State management via Zustand (client-side) and TanStack Query (server-side). Axios for HTTP requests with JWT interceptors, and React Router DOM for navigation.

**Core Feature Specifications:**
*   **Authentication:** User registration, login with password visibility toggle (eye icon), JWT token management, PIN setup/change, and visual-only features for forgot password and social login. Password toggle includes full keyboard and screen-reader accessibility.
*   **Wallet:** Balance display, top-up, peer-to-peer transfers, multi-currency support with transfer scheduling, and secure QR code payment system.
*   **QR Code Payments:** Secure payment initiation via QR codes using `itsdangerous` signed tokens (not JWT) with 5-minute expiry. Tokens are exclusively for payment verification and cannot be used for API authentication. Features include: token generation endpoint (`/wallet/qr-payment-token`), token verification endpoint (`/wallet/verify-qr-token`), frontend QR display with expiry warning, camera-based QR scanner using `html5-qrcode`, recipient validation (existence, active status, prevents self-transfers), and automatic recipient auto-fill after successful verification.
*   **Transactions:** Comprehensive tracking, filtering, and statistical analysis for 15+ types, including "expected payments" (CRUD, recurring), balance validation, race condition protection, detailed records, and automatic query invalidation.
*   **Virtual Cards:** Creation, management (freeze/unfreeze), linking to subscriptions, and payment checks.
*   **Subscriptions:** Management of recurring payments.
*   **Savings & Goals:** Dedicated goal tracking with progress indicators, contributions, editable targets, and completion celebrations.
*   **DarkDays Pocket:** Secure, PIN-protected savings pockets with auto-save options, consolidated settings, and emergency withdrawal flow with security verification.
*   **Marketplace:** Student-to-student commerce with listings and escrow services, buyer balance validation, and dual transaction recording.
*   **P2P Lending:** Request-approval system with distinct tabs, approval workflow, summary statistics, full loan lifecycle tracking, role-based actions, visual indicators, and robust security.
*   **ISIC Discounts:** Integration for student card-based discounts.
*   **Security Settings:** PIN management, visual-only features for email verification, 2FA, active sessions, rate limiting, and session timeout.
*   **Notifications:** Comprehensive toast notification system and optimized UI dialogs for various screen sizes.
*   **Profile Photo Upload:** Secure profile photo upload with validation, secure storage, and automatic cleanup.

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