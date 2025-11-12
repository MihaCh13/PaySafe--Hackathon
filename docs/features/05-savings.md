# Savings Feature

**Status:** ✅ **COMPLETED**

## Overview
Dual savings system with DarkDays Pocket (secure savings with auto-save) and Piggy Goals (goal-based savings with progress tracking).

## Purpose
- Encourage saving habits
- Set and track financial goals
- Automated savings (auto-save percentage)
- PIN-protected withdrawals for security
- Gamification with progress tracking

## Location
- **Frontend:** `src/features/savings/pages/SavingsPage.tsx`
- **Backend:** `backend/app/blueprints/savings.py`
- **API:** `src/lib/api.ts` (savingsAPI)

## Components

### SavingsPage
- DarkDays Pocket card
- Goals list with progress bars
- Create goal dialog
- Contribute to goals dialog
- Withdraw from savings dialog (PIN protected)
- Auto-save configuration

## Functionality

### DarkDays Pocket ✅
- [x] Secure savings account
- [x] Auto-save percentage configuration
- [x] PIN-protected withdrawals
- [x] Balance display
- [x] Deposit functionality
- [x] Withdrawal with PIN verification

### Piggy Goals ✅
- [x] Create savings goals with target amounts
- [x] Track progress with visual progress bars
- [x] Contribute to goals
- [x] Mark goals as completed
- [x] Goal descriptions and names
- [x] Multiple goals support
- [x] Achievement badges (when goal reached)

## Technical Implementation

### DarkDays Pocket API
```typescript
savingsAPI.getPocket() // Get pocket balance
savingsAPI.depositToPocket(amount) // Add funds
savingsAPI.withdrawFromPocket(amount, pin) // Withdraw with PIN
savingsAPI.setAutoSave(percentage) // Configure auto-save
```

### Piggy Goals API
```typescript
savingsAPI.getGoals() // List all goals
savingsAPI.createGoal({ name, target_amount, description })
savingsAPI.contributeToGoal(goalId, amount)
savingsAPI.completeGoal(goalId)
```

### Auto-Save Logic
```python
# Triggered on every top-up
if auto_save_percentage > 0:
    auto_save_amount = topup_amount * (auto_save_percentage / 100)
    pocket.balance += auto_save_amount
    wallet.balance -= auto_save_amount
```

### Progress Calculation
```typescript
const progress = (currentAmount / targetAmount) * 100
// Visual progress bar shows percentage
// Confetti animation when goal reached
```

## Database Schema
```sql
savings_pockets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  auto_save_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
)

goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0.00,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
)
```

## Security Features
- PIN verification for withdrawals
- Auto-save can't exceed wallet balance
- Contribution validation (amount > 0)
- Goal completion locks further contributions

## UI/UX Features
- Gradient cards for visual appeal
- Progress bars with smooth animations
- Confetti effect on goal completion
- Toast notifications for all actions
- Loading states during operations
- Input validation (min, step attributes)
- Empty states with encouraging messages

## DarkDays Pocket Features
### Purpose
Secure, hard-to-access savings that require PIN for withdrawals

### Benefits
- Prevents impulse spending
- Automated savings (set-and-forget)
- Security through PIN protection
- Visual separation from main wallet

## Piggy Goals Features
### Purpose
Visual, goal-oriented savings with gamification

### Benefits
- Clear financial targets
- Progress tracking motivation
- Multiple goals simultaneously
- Achievement system
- Descriptive goal naming

## Integration Points
- **Wallet**: Transfers money to/from wallet
- **Transactions**: All savings operations logged
- **Auto-save**: Triggers on top-ups
- **Profile**: Achievements for completed goals

## Error Handling
- Insufficient wallet balance
- Invalid PIN errors
- Negative amount validation
- Goal already completed errors
- Over-contribution prevention

## Future Enhancements
- [ ] Savings challenges (30-day challenge)
- [ ] Group goals (family/friends pooling)
- [ ] Interest on savings balances
- [ ] Goal templates (vacation, laptop, etc.)
- [ ] Savings streaks and rewards
- [ ] Round-up savings (round purchases to nearest dollar)
- [ ] Goal reminders and notifications
- [ ] Visual goal categories with icons
- [ ] Savings history and analytics
- [ ] Goal sharing on social media
