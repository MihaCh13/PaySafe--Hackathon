# Virtual Cards Feature

**Status:** ✅ **COMPLETED**

## Overview
Virtual card management system allowing users to create, manage, and control digital payment cards.

## Purpose
- Create virtual cards for online payments
- Freeze/unfreeze cards for security
- Link cards to subscriptions
- Set spending limits per card
- Manage multiple cards

## Location
- **Frontend:** `src/features/cards/pages/CardsPage.tsx`
- **Backend:** `backend/app/blueprints/cards.py`
- **API:** `src/lib/api.ts` (cardsAPI)

## Components

### CardsPage
- Card list with gradient designs
- Create card dialog
- Freeze/unfreeze controls
- Spending limit management
- Subscription tracking (coming soon)

## Functionality

### Implemented Features ✅
- [x] Create virtual cards
- [x] Custom card names
- [x] Card types (standard, premium, student)
- [x] Spending limits (optional)
- [x] Freeze card functionality
- [x] Unfreeze card functionality
- [x] Visual card display with gradients
- [x] Per-card loading states (Set-based)
- [x] Card status indicators
- [x] Smooth animations

### Backend Endpoints
```python
GET    /api/cards              # List all cards
POST   /api/cards              # Create new card
GET    /api/cards/<id>         # Get card details
POST   /api/cards/<id>/freeze  # Freeze card
POST   /api/cards/<id>/unfreeze # Unfreeze card
```

## Technical Implementation

### Card Creation
```typescript
createCard({
  card_name: string,
  card_type: 'standard' | 'premium' | 'student',
  spending_limit?: number
})
```

### Per-Item Loading States
```typescript
// Uses Set-based approach to prevent race conditions
const [mutatingCardIds, setMutatingCardIds] = useState<Set<number>>(new Set());

// Can freeze/unfreeze multiple cards simultaneously
- Add card ID to Set on mutation start
- Remove card ID from Set on success/error
- Button disabled only for specific card being mutated
```

### Card Display
- Gradient backgrounds per card type
- Masked card numbers
- Expiry date display
- CVV security
- Frozen status overlay

### Freeze/Unfreeze Logic
```python
def freeze_card(card_id):
    card = VirtualCard.query.get_or_404(card_id)
    card.is_frozen = True
    db.session.commit()
    return {"message": "Card frozen successfully"}
```

## Database Schema
```sql
virtual_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  card_name VARCHAR(100),
  card_number VARCHAR(16) UNIQUE,
  expiry_date DATE,
  cvv VARCHAR(3),
  card_type VARCHAR(20),
  is_frozen BOOLEAN DEFAULT FALSE,
  spending_limit DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Card Types
1. **Standard**
   - Default card type
   - No special benefits
   - Blue/violet gradient

2. **Premium**
   - Higher spending limits
   - Cashback rewards (planned)
   - Gold gradient

3. **Student**
   - Student discount integration
   - Lower fees
   - Green gradient

## Security Features
- Card freezing for lost/stolen cards
- Individual card spending limits
- Frozen cards reject all transactions
- PIN verification for sensitive operations (planned)

## UI/UX Features
- Framer Motion animations
- Card flip animation on hover
- Loading states during freeze/unfreeze
- Toast notifications
- Gradient card designs
- Responsive grid layout

## Integration Points
- **Subscriptions**: Cards can be linked to recurring payments
- **Marketplace**: Cards can be used for purchases
- **Wallet**: Cards draw from wallet balance

## Error Handling
- Card not found errors
- Permission checks (user owns card)
- Concurrent operation protection
- Validation errors with toast feedback

## Future Enhancements
- [ ] Card to card transfers
- [ ] Virtual card numbers
- [ ] Temporary cards (auto-expire)
- [ ] Transaction notifications per card
- [ ] Card usage analytics
- [ ] Apple Pay / Google Pay integration
- [ ] Card replacement
- [ ] Card deletion with refund
