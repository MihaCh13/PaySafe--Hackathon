# UniPay Documentation

## Overview
This documentation folder contains comprehensive information about all UniPay components, features, and implementation details.

## Documentation Structure

### 📁 Features Documentation (`docs/features/`)
- Detailed documentation for each feature module
- Implementation status (✅ Completed | 🚧 In Progress | 📋 Planned)
- Component descriptions and functionality
- Technical implementation details

### 📁 Architecture Documentation (`docs/architecture/`)
- System architecture overview
- Database schema and relationships
- API design patterns
- Frontend architecture

### 📁 API Documentation (`docs/api/`)
- Endpoint specifications
- Request/Response formats
- Authentication flow
- Error handling

## Quick Links

### ✅ Completed Features
- [Authentication](features/01-authentication.md) - Login, Register, JWT tokens
- [Wallet](features/02-wallet.md) - Balance, Top-up, Transfers  
- [Cards](features/03-cards.md) - Virtual cards, Freeze/Unfreeze
- [Transactions](features/04-transactions.md) - History, Statistics
- [Savings](features/05-savings.md) - DarkDays Pocket, Piggy Goals
- [Marketplace](features/06-marketplace.md) - Student trading platform
- [Loans](features/07-loans.md) - P2P lending and debt tracking
- [Profile](features/08-profile.md) - User profile and achievements
- [Settings](features/09-settings.md) - Account settings
- [Transfers](features/10-transfers.md) - Dedicated transfer interface
- [Top-up](features/11-topup.md) - Wallet funding methods
- [Notifications](features/12-notifications.md) - Real-time alerts
- [Subscriptions](features/13-subscriptions.md) - Recurring payment management
- [DarkDays Pocket](features/14-darkdays-pocket.md) - Secure savings vault

## Development Status

| Feature | Status | Backend API | Frontend UI | Documentation |
|---------|--------|-------------|-------------|---------------|
| Authentication | ✅ Complete | ✅ | ✅ | ✅ |
| Wallet | ✅ Complete | ✅ | ✅ | ✅ |
| Cards | ✅ Complete | ✅ | ✅ | ✅ |
| Transactions | ✅ Complete | ✅ | ✅ | ✅ |
| Savings | ✅ Complete | ✅ | ✅ | ✅ |
| Marketplace | ✅ Complete | ✅ | ✅ | ✅ |
| Loans | ✅ Complete | ✅ | ✅ | ✅ |
| Profile | ✅ Complete | ✅ | ✅ | ✅ |
| Settings | ✅ Complete | ✅ | ✅ | ✅ |
| Transfers | ✅ Complete | ✅ | ✅ | ✅ |
| Top-up | ✅ Complete | ✅ | ✅ | ✅ |
| Notifications | 🚧 UI Only | 📋 Planned | ✅ | ✅ |
| Subscriptions | ✅ Complete | ✅ | ✅ | ✅ |
| DarkDays Pocket | ✅ Complete | ✅ | ✅ | ✅ |

## Recent Updates

### November 8, 2025
**🐛 Critical Bug Fix: Infinite Redirect Loop**
- Fixed application flickering and white screen issues
- Enhanced Axios interceptor with duplicate redirect prevention
- Implemented query gating to prevent unauthorized API calls
- Improved React Query retry logic for 401 errors
- **Impact**: Stable, flicker-free authentication flow

See [Authentication Documentation](features/01-authentication.md#critical-bug-fixes) and [Architecture Overview](architecture/overview.md#authentication--query-management-updated-nov-8-2025) for technical details.

## Getting Started

1. Read the [Architecture Overview](architecture/overview.md)
2. Review [API Documentation](api/endpoints.md)
3. Explore individual feature documentation in `features/`

## Contributing

When adding new features:
1. Create feature documentation in `docs/features/`
2. Update this README with links and status
3. Document API endpoints in `docs/api/`
4. Update architecture diagrams if needed
