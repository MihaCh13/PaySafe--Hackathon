# Top-Up Transaction Flow Documentation

## Overview
This document describes how top-up transactions flow through UniPay from the user action to display in all relevant views.

## Complete Transaction Flow

### 1. User Initiates Top-Up
**Location:** `/topup` page (TopupPage.tsx)
- User enters amount and selects payment method (card/bank/QR)
- Click "Top Up" button triggers the `handleTopup()` function
- Amount is converted to USD for backend consistency

### 2. Frontend API Call
**File:** `src/features/topup/pages/TopupPage.tsx`
```typescript
topupMutation.mutate({
  amount: amountInUSD,
  method: selectedMethod,
});
```

### 3. Backend Processing
**File:** `backend/app/blueprints/wallet.py`
**Endpoint:** `POST /api/wallet/topup`

The backend performs these operations in a database transaction:
1. **Validate amount** (must be > 0)
2. **Lock wallet row** using `with_for_update()` (prevents race conditions)
3. **Update wallet balance:** `wallet.balance += amount_decimal`
4. **Create transaction record:**
   - `transaction_type: 'topup'`
   - `status: 'completed'`
   - `receiver_id: user_id`
   - `description: 'Top-up via {method}'`
   - `completed_at: current timestamp`
   - `transaction_metadata: {'method': method}`
5. **Commit to database** (atomic operation)
6. **Return response** with updated wallet and transaction data

### 4. Frontend Success Handler
**File:** `src/features/topup/pages/TopupPage.tsx`

On successful top-up, the mutation invalidates three query keys:
```typescript
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({ queryKey: ['wallet'] });
  queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
  queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
  toast.success(`Successfully added ${amount} to your wallet!`);
}
```

### 5. UI Updates (Automatic)

#### 5.1 Dashboard Balance Card
**Query Key:** `['wallet']`
- **Location:** Dashboard page, top section
- **Updates:** Current balance amount
- **Timing:** Immediate (optimistic update via query invalidation)

#### 5.2 Dashboard Recent Transactions
**Query Key:** `['transaction-stats']`
**Location:** Dashboard page, "Recent Transactions" section
- **Displays:** 
  - Transaction description: "Top-up via {method}"
  - Amount with "+" prefix in green
  - Date formatted as "Month Day, Year"
  - Green ArrowDownLeft icon with success background
- **Timing:** Immediate after query refetch

#### 5.3 Activity/Transactions Page
**Query Key:** `['all-transactions']`
**Location:** `/transactions` page
- **Updates:**
  - Main transaction list (CollapsibleTransactionList)
  - Calendar view (transactionsByDate)
  - Total Income stat card
  - Transaction count
- **Timing:** Immediate when navigating to page or if already on page

#### 5.4 Transaction Stats
**Query Key:** `['transaction-stats']`
**Location:** Dashboard and Transactions pages
- **Updates:**
  - Total Income (increases by top-up amount)
  - Transaction count (increments by 1)
- **Timing:** Immediate after query refetch

## Transaction Details Displayed

### Required Fields (All Views)
- ✅ **Amount:** Full decimal value in selected currency
- ✅ **Date:** Timestamp of when top-up completed
- ✅ **Transaction Type:** "topup"
- ✅ **Status:** "completed"
- ✅ **Description:** "Top-up via {method}"

### Visual Indicators
- ✅ **Icon:** Green ArrowDownLeft (incoming transaction)
- ✅ **Background:** bg-success-light (light green)
- ✅ **Icon Color:** text-success-hover (green)
- ✅ **Amount Color:** text-success-hover (green with + prefix)

## Database Schema

### Transaction Table Fields
```sql
- id: Primary key
- user_id: Foreign key to users
- transaction_type: 'topup'
- amount: Decimal (precise to 2 decimal places)
- description: String (e.g., "Top-up via card")
- status: 'completed'
- receiver_id: user_id (self-referential for top-ups)
- sender_id: NULL (no sender for top-ups)
- created_at: Timestamp (auto-generated)
- completed_at: Timestamp (set on completion)
- transaction_metadata: JSON (contains method info)
```

## Query Invalidation Strategy

### Why Multiple Query Invalidations?
1. **`['wallet']`**: Updates balance in TopUp page and Dashboard balance card
2. **`['all-transactions']`**: Updates transaction lists in Activity page
3. **`['transaction-stats']`**: Updates Dashboard stats (Total Income, Recent Transactions)

This ensures immediate visibility across all views without requiring manual page refreshes.

## Race Condition Protection

### Database-Level Locking
- Uses `with_for_update()` to lock wallet row during transaction
- Prevents concurrent top-ups from corrupting balance
- Ensures atomic balance updates

### Transaction Integrity
- All database operations wrapped in single transaction
- Rollback on any error maintains data consistency
- No partial updates possible

## Error Handling

### Backend Errors
- Invalid amount (≤ 0): HTTP 400
- Wallet not found: HTTP 404
- Database errors: HTTP 500 with rollback

### Frontend Errors
- Network errors: Toast notification with error message
- Validation errors: Inline validation before submission
- Success confirmation: Toast notification with formatted amount

## Testing Checklist

To verify top-up transaction flow works correctly:

1. ✅ **Perform Top-Up**
   - Navigate to `/topup`
   - Enter amount and select method
   - Click "Top Up" button
   - Verify success toast appears

2. ✅ **Check Dashboard Balance**
   - Balance card shows updated amount immediately
   - No page refresh required

3. ✅ **Check Dashboard Recent Transactions**
   - New transaction appears at top of list
   - Shows correct amount with "+" prefix
   - Shows green icon (ArrowDownLeft)
   - Shows correct date
   - Shows status as "completed"

4. ✅ **Check Activity Page**
   - Navigate to `/transactions`
   - Transaction appears in "All Transactions" list
   - Transaction appears in calendar view on correct date
   - Total Income stat increases by top-up amount
   - Transaction count increments by 1

5. ✅ **Verify Transaction Details**
   - Amount matches entered value
   - Description includes payment method
   - Status is "completed"
   - Timestamp is recent

## Backend Logs Example

Successful top-up log entry:
```
127.0.0.1 - - [10/Nov/2025 17:41:11] "POST /api/wallet/topup HTTP/1.1" 200 -
127.0.0.1 - - [10/Nov/2025 17:41:11] "GET /api/wallet/ HTTP/1.1" 200 -
```

## Summary

The top-up transaction system ensures:
- ✅ **Immediate Balance Update:** Wallet balance updates instantly
- ✅ **Comprehensive Logging:** Full transaction record with metadata
- ✅ **Multi-View Consistency:** Updates appear in Dashboard, Activity, and all transaction lists
- ✅ **Data Integrity:** Database-level locking prevents race conditions
- ✅ **User Feedback:** Success notifications and visual confirmations
- ✅ **Accurate Details:** All transaction fields correctly populated and displayed
