# UniPay - Smart Student Digital Wallet

## Overview
UniPay is a digital wallet application for students, integrating financial services with lifestyle features. It aims to be an essential financial tool, offering secure digital payments, subscription management, student discounts, savings goal tracking, and peer-to-peer lending and marketplace functionalities. UniPay provides convenience, security, customized benefits, and fosters financial literacy and independence among students.

## Recent Changes

### November 20, 2025 - Production Readiness Updates
*   **SMTP Configuration Fixed:** Updated `backend/config.py` to use `SMTP_*` environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD) matching Replit Secrets. Password reset emails now send successfully via Gmail SMTP.
*   **Password Reset Flow Verified:** Complete end-to-end testing confirmed - email delivery, token generation, password update, and login with new password all working correctly.
*   **Production Deployment Configured:** Added Gunicorn deployment configuration with gevent workers for Socket.IO compatibility. Uses autoscale deployment target with frontend build step.
*   **Important Note:** For production deployment, ensure `gevent` is installed as a Python dependency to support Flask-SocketIO with Gunicorn (eventlet is deprecated as of 2024).

## User Preferences
No specific user preferences recorded yet. This section will be updated as development progresses.

## System Architecture

UniPay is structured as a single-page application (SPA) with a clear separation between its backend and frontend components.

### UI/UX Decisions
The frontend features a modern, Revolut-inspired interface, built with `shadcn/ui` (Radix UI, Tailwind CSS). Key design elements include a fixed top navigation, a fully responsive collapsible left sidebar, a modern color palette with violet/indigo gradients and pastel accents, card-based layouts, Framer Motion for animations, and a gradient balance card with quick action buttons. `DashboardLayout` is used for authenticated users and `AuthLayout` for unauthenticated users. Branding includes a modern icon-based logo (`public/assets/logo.png`) and gradient text styling for "UniPay". The design system uses `CSS clamp()` for responsive scaling and a centralized animation system with Framer Motion variants. Consistent transaction color coding (green for incoming, red for outgoing) and a standardized dialog/popup scrolling pattern are implemented.

### Technical Implementations
*   **Backend:** Flask (Python), SQLAlchemy (PostgreSQL), Flask-JWT-Extended for authentication, Flask-SocketIO for real-time features. It uses an Application Factory Pattern and Flask Blueprints for modularity, with security measures like JWT, password hashing, PIN protection, and CORS.
*   **Frontend:** React 18 and Vite. State management via Zustand (client-side) and TanStack Query (server-side). Axios is used for HTTP requests with JWT interceptors, and React Router DOM for navigation.

**Core Feature Specifications:**
*   **Authentication:** User registration with enhanced validation, login, JWT token management, PIN setup/change, and a complete password reset flow with secure token-based email notifications via SMTP.
*   **Wallet:** Balance display, top-up, peer-to-peer transfers, multi-currency support, transfer scheduling, and a secure QR code payment system using `itsdangerous` signed tokens.
*   **Transactions:** Comprehensive tracking, filtering, and statistical analysis for 15+ types. Scheduled transactions use `created_at` for the billing/due date, not creation timestamp, enabling calendar filtering. A Finance Timeline Calendar displays upcoming payments from regular transactions, expected payments, and active subscriptions.
*   **Virtual Cards:** Creation, management (freeze/unfreeze), and linking to subscriptions.
*   **Subscriptions:** Management of recurring payments with an idempotent `Subscription Scheduler Service` (`backend/app/services/subscription_scheduler.py`) that ensures upcoming payment scheduling within a defined horizon.
*   **Savings & Goals:** Dedicated goal tracking with progress indicators and contributions.
*   **DarkDays Pocket:** Secure, PIN-protected savings pockets with auto-save options.
*   **Marketplace:** Student-to-student commerce with listings and escrow services.
*   **P2P Lending:** Request-approval system with approval workflows and loan lifecycle tracking.
*   **ISIC Discounts:** Integration for student card-based discounts with 50 active merchant partners across 10 categories (Accommodation, Culture, Entertainment, Food & Drink, Services, Shopping, Sport, Study, Travel, Other). Features include online/in-store discount detection, QR code verification, automatic discount calculation, and savings history tracking. Major partnerships include KFC, Subway, Starbucks, Under Armour, JetBrains, FlixBUS, QATAR Airways, and Bulgarian State Railways (БДЖ).
*   **Security Settings:** PIN management, visual-only features for email verification, 2FA, active sessions, rate limiting, and session timeout.
*   **Notifications:** Comprehensive system with persistent bell icon badge, Zustand store with localStorage persistence, toast notifications for financial actions, and currency-aware formatting.
*   **Budget Cards & Payment Cards Section:** Redesigned with compact, consistent card tiles and reusable components. Main Wallet Card, Payment Cards (One-Time & Standard), Budget Cards, and Subscription Cards feature consistent layouts, color-coded gradients, financial overviews (allocated, spent, remaining balance), and redesigned action buttons in a 2-row layout with fixed positioning. Progress bars indicate spending percentage, and tab counters accurately reflect displayed cards.

### System Design Choices
*   **Database Schema:** Core entities include Users, Wallets, Transactions, VirtualCards, Subscriptions, SavingsPockets, Goals, Marketplace (Listings, Orders), Loans, Repayments, and ISIC models.
*   **API Design:** RESTful API with logically organized endpoints and proper HTTP status codes.
*   **Development Workflow:** Supports concurrent backend (Python) and frontend (Node.js) development with API proxying. Flask-Migrate (Alembic) handles database migrations.

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