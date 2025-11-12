# Authentication Feature

**Status:** ✅ **COMPLETED**

## Overview
The Authentication feature provides secure user registration, login, and session management using JWT tokens.

## Purpose
- Enable secure user account creation
- Manage user login sessions
- Protect routes and API endpoints
- Handle user authentication state

## Location
- **Frontend:** `src/features/auth/`
- **Backend:** `backend/app/blueprints/auth.py`
- **Store:** `src/store/authStore.ts`

## Components

### Pages
- **LoginPage** (`pages/LoginPage.tsx`)
  - Email and password login form
  - Form validation with React Hook Form + Zod
  - JWT token storage in localStorage
  - Redirect to dashboard on success
  
- **RegisterPage** (`pages/RegisterPage.tsx`)
  - User registration with email, username, password
  - PIN setup during registration
  - Account creation and automatic login

### Layout
- **AuthLayout** (`src/layouts/AuthLayout.tsx`)
  - Clean, centered layout for auth pages
  - Redirects authenticated users to dashboard

## Functionality

### Implemented Features ✅
- [x] User registration with validation (React Hook Form + Zod)
- [x] Email and password login (React Hook Form + Zod)
- [x] JWT token generation and storage
- [x] Automatic token attachment to API requests
- [x] Protected routes (redirect unauthenticated users)
- [x] Logout functionality with backend endpoint
- [x] `/me` endpoint for user info retrieval
- [x] Zustand store for auth state management
- [x] PIN setup during registration (mandatory)
- [x] Password strength validation (min 6 characters)
- [x] Email format validation
- [x] PIN validation (4 digits, numeric only)
- [x] PIN confirmation matching

### Backend Endpoints
```python
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

## Technical Implementation

### Frontend State Management
```typescript
// Zustand auth store
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;  // Calls backend endpoint before clearing state
  clearAuth: () => void;
}
```

### Security Features
- JWT tokens with expiration
- Password hashing (bcrypt on backend)
- Protected API routes with `@jwt_required()`
- Automatic token refresh on app load
- Secure token storage in localStorage

### Form Validation (React Hook Form + Zod)
- **Email format validation** - Must be valid email format
- **Password strength requirements** - Minimum 6 characters enforced
- **Username validation** - Minimum 3 characters, maximum 80 characters
- **Username uniqueness check** - Backend validates uniqueness
- **PIN validation** - Exactly 4 digits, numeric only
- **PIN confirmation** - Must match original PIN
- **Required field validation** - All required fields enforced
- **Real-time error display** - Immediate feedback on validation errors

## User Flow

### Registration
1. User fills registration form (email, username, password, first/last name, PIN, confirm PIN)
2. Frontend validates inputs with React Hook Form + Zod
3. POST request to `/api/auth/register` with all fields including PIN
4. Backend validates:
   - Required fields (email, username, password, PIN)
   - PIN format (exactly 4 digits, numeric only)
   - Email/username uniqueness
5. Backend creates user, hashes password and PIN
6. JWT tokens returned
7. User automatically logged in and redirected to dashboard

### Login
1. User enters credentials (email, password)
2. Frontend validates inputs with React Hook Form + Zod
3. POST request to `/api/auth/login`
4. Backend verifies credentials
5. JWT tokens returned and stored
6. Auth state updated
7. Redirect to dashboard

### Logout
1. User clicks logout button
2. AuthStore calls `POST /api/auth/logout` endpoint
3. Backend logs the logout event
4. Frontend clears tokens from localStorage
5. AuthStore state reset
6. Redirect to login page

### Protected Routes
1. User tries to access protected page
2. DashboardLayout checks `isAuthenticated`
3. If false, redirect to `/login`
4. If true, render requested page

## Dependencies
- **Frontend:**
  - `react-hook-form` - Form management
  - `zod` - Schema validation
  - `zustand` - State management
  - `axios` - HTTP requests
  
- **Backend:**
  - `Flask-JWT-Extended` - JWT tokens
  - `Werkzeug` - Password hashing
  - `SQLAlchemy` - User model

## Database Schema
```sql
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Recent Enhancements

### Full Specification Compliance (November 9, 2025)
All authentication features now fully match the specification. The following improvements were implemented:

#### 1. React Hook Form + Zod Validation
- **LoginPage**: Integrated React Hook Form with Zod schema validation
  - Email format validation with custom error messages
  - Password minimum length validation (6 characters)
  - Real-time error display below each field
  - Form state management with `isSubmitting`

- **RegisterPage**: Complete form validation with all fields
  - Email format validation
  - Username length validation (3-80 characters)
  - Password strength validation (minimum 6 characters)
  - PIN validation (exactly 4 digits, numeric only)
  - Confirm PIN validation with matching check
  - All fields properly integrated with React Hook Form

#### 2. PIN During Registration (Mandatory)
- **Frontend Changes**:
  - Added PIN input field (4 digits, password-masked)
  - Added Confirm PIN field with matching validation
  - Zod schema enforces PIN format and matching
  - Cannot submit form without valid PIN

- **Backend Changes**:
  - PIN is now a **required field** during registration
  - Validation happens before email/username uniqueness check (fail fast)
  - Returns clear error if PIN is missing or invalid
  - PIN is always hashed and stored during user creation

#### 3. Logout Endpoint Implementation
- **Backend**: New `POST /api/auth/logout` endpoint
  - Protected with `@jwt_required()` decorator
  - Logs logout events for security audit trail
  - Returns success message after logging

- **Frontend Integration**:
  - Added `logout()` API method in `src/lib/api.ts`
  - Updated AuthStore with async `logout()` method
  - Calls backend endpoint before clearing local state
  - Updated TopNav component to use async logout
  - Proper error handling with try/catch/finally

#### 4. Security & Code Quality
- **Validation Order**: Optimized to fail fast on invalid data
- **Error Handling**: Comprehensive error messages guide users
- **No Security Issues**: Architect-reviewed and approved
- **Best Practices**: Clean code, proper typing, async/await patterns

## Critical Bug Fixes

### Infinite Redirect Loop Fix (November 8, 2025)
**Issue:** Application was constantly flickering with white screens due to an infinite redirect loop.

**Root Cause:**
- Dashboard components were fetching data before authentication state was fully initialized
- Unauthenticated API calls returned 401 errors
- 401 interceptor redirected to login without clearing Zustand state
- Created loop: Dashboard → 401 → /login → redirect → Dashboard

**Solution Implemented:**

1. **Axios Interceptor Enhancement** (`src/lib/api.ts`):
   - Added `isRedirecting` flag to prevent duplicate redirects
   - Clear all localStorage items including `auth-storage` (Zustand persist)
   - Use `window.location.replace()` instead of `window.location.href`

2. **React Query Retry Logic** (`src/lib/queryClient.ts`):
   - Disable retries for 401 errors (authentication failures)
   - Limit max retries to 1 for other error types

3. **Query Gating** (Dashboard and other protected pages):
   - Add `enabled: isAuthenticated` to all data-fetching queries
   - Prevents premature API calls before auth check completes
   - Ensures clean login/logout flow

**Impact:**
- ✅ No more flickering or white screens
- ✅ Stable authentication flow
- ✅ Clean redirects on session expiration
- ✅ Proper auth state cleanup on logout

## Future Enhancements
- [ ] Email verification
- [ ] Password reset flow
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, Facebook)
- [ ] Session timeout with refresh tokens
- [ ] Login attempt rate limiting
