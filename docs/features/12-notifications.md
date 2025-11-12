# Notifications Feature

**Status:** 🚧 **UI COMPLETED** | 📋 **WebSocket Integration Planned**

## Overview
Real-time notification system for alerts, updates, and important account activities.

## Purpose
- Instant activity alerts
- Transaction notifications
- Security alerts
- Achievement notifications
- System updates
- Social interactions

## Location
- **Frontend:** `src/features/notifications/pages/NotificationsPage.tsx`
- **Backend:** WebSocket integration (planned)
- **API:** Mock data (planned backend endpoints)

## Components

### NotificationsPage
- Notification list with icons
- Filter controls (all/unread)
- Mark as read functionality
- Delete notifications
- Relative time display
- Notification categories with colors
- Empty state handling

## Functionality

### Implemented Features ✅
- [x] Display notifications with mock data
- [x] Notification types (payment, transfer, security, info, achievement)
- [x] Mark individual as read
- [x] Mark all as read
- [x] Delete notifications
- [x] Filter (all/unread)
- [x] Unread count badge
- [x] Icon-based categorization
- [x] Color coding by type
- [x] Relative time ("5m ago", "2h ago")
- [x] Empty state

### Planned Features 📋
- [ ] WebSocket real-time updates
- [ ] Backend API integration
- [ ] Push notifications
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Notification preferences
- [ ] Notification sounds
- [ ] Desktop notifications

## Notification Types

### Payment Notifications
- **Icon**: CreditCard
- **Color**: Blue
- **Examples**:
  - Top-up successful
  - Payment completed
  - Card payment processed

### Transfer Notifications
- **Icon**: DollarSign
- **Color**: Green
- **Examples**:
  - Money received
  - Transfer sent
  - Transfer failed

### Security Notifications
- **Icon**: AlertCircle
- **Color**: Red
- **Examples**:
  - New login detected
  - Password changed
  - Suspicious activity
  - Card frozen

### Achievement Notifications
- **Icon**: Gift
- **Color**: Yellow
- **Examples**:
  - Savings goal reached
  - First transaction
  - Milestone achieved
  - Level up

### Info Notifications
- **Icon**: Info
- **Color**: Violet
- **Examples**:
  - New feature available
  - System maintenance
  - Tips and tricks
  - Updates

## Technical Implementation

### Notification Interface
```typescript
interface Notification {
  id: number;
  type: 'payment' | 'transfer' | 'security' | 'info' | 'achievement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: LucideIcon;
  color: string;
}
```

### Mark as Read
```typescript
markAsRead(id) => {
  setNotifications(prev =>
    prev.map(n => n.id === id ? { ...n, read: true } : n)
  )
}
```

### Filter Logic
```typescript
const filteredNotifications = filter === 'unread'
  ? notifications.filter(n => !n.read)
  : notifications;
```

### Relative Time
```typescript
getRelativeTime(date) {
  const seconds = (Date.now() - date.getTime()) / 1000;
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

## UI/UX Features
- Card-based notification list
- Color-coded icons by type
- Unread indicator (violet border)
- Hover effects
- Mark as read button
- Delete button
- Filter toggle
- Empty state with icon
- Smooth animations
- Responsive layout

## WebSocket Integration (Planned)

### Connection Setup
```typescript
const socket = io('wss://api.unipay.com');

socket.on('notification', (data) => {
  addNotification(data);
  showToast(data.title);
  playSound();
});
```

### Event Types
- `transaction:completed`
- `transfer:received`
- `goal:achieved`
- `security:alert`
- `marketplace:sold`
- `loan:repaid`

## Backend API (Planned)

### Endpoints
```typescript
GET    /api/notifications           // Get all notifications
GET    /api/notifications/unread    // Get unread only
POST   /api/notifications/:id/read  // Mark as read
DELETE /api/notifications/:id       // Delete notification
POST   /api/notifications/read-all  // Mark all as read
```

### Database Schema (Planned)
```sql
notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Notification Triggers

### Automatic Triggers
- Transaction completed → Payment notification
- Money received → Transfer notification
- Card frozen → Security notification
- Goal reached → Achievement notification
- New message → Social notification

### Manual Triggers
- Admin announcements
- System updates
- Feature releases
- Maintenance alerts

## Integration Points
- **Wallet**: Transaction notifications
- **Transfers**: Send/receive alerts
- **Savings**: Goal achievements
- **Marketplace**: Order updates
- **Loans**: Repayment reminders
- **Security**: Login alerts

## Error Handling
- Failed to load notifications
- WebSocket connection errors
- Mark as read failures
- Delete failures
- Network errors

## Future Enhancements
- [ ] Real-time WebSocket updates
- [ ] Push notification support
- [ ] Email notification integration
- [ ] SMS alerts for critical events
- [ ] Notification preferences per type
- [ ] Quiet hours / Do Not Disturb
- [ ] Notification grouping
- [ ] Notification search
- [ ] Notification archive
- [ ] Custom notification sounds
- [ ] Desktop notification support
- [ ] Mobile app notifications
- [ ] Notification priority levels
- [ ] Digest emails (daily/weekly summary)
- [ ] Rich notifications with actions
