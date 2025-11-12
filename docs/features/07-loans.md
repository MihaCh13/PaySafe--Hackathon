# P2P Loans Feature

**Status:** ✅ **COMPLETED**

## Overview
Peer-to-peer lending system allowing students to lend money to friends and track debts.

## Purpose
- Facilitate student lending
- Track outstanding debts
- Manage loan repayments
- Build trust in student community
- Financial responsibility education

## Location
- **Frontend:** `src/features/loans/pages/LoansPage.tsx`
- **Backend:** `backend/app/blueprints/loans.py`
- **API:** `src/lib/api.ts` (loansAPI)

## Components

### LoansPage
- Create loan dialog
- Given loans (as lender)
- Received loans (as borrower)
- Repayment functionality
- Debt tracking
- Loan status indicators

## Functionality

### Implemented Features ✅
- [x] Create loans to other users
- [x] Username-based borrower lookup
- [x] Loan amount and description
- [x] Track given loans (lender view)
- [x] Track received loans (borrower view)
- [x] Make partial repayments
- [x] Make full repayments
- [x] Automatic loan status updates
- [x] Remaining balance calculation
- [x] Per-loan loading states
- [x] Repayment history

## Technical Implementation

### Create Loan
```typescript
createLoan({
  borrower_username: string,
  amount: number,
  description: string
})

Flow:
1. Verify lender has sufficient funds
2. Deduct from lender's wallet
3. Create loan record
4. Credit borrower's wallet
5. Create transaction records
```

### Loan Repayment
```typescript
repayLoan(loanId, amount) => {
  1. Verify borrower has funds
  2. Calculate remaining debt
  3. Process partial or full repayment
  4. Update loan.amount_repaid
  5. Check if fully repaid
  6. Update loan status
  7. Transfer funds to lender
}
```

### Per-Item Loading States
```typescript
// Set-based approach for concurrent repayments
const [repayingLoanIds, setRepayingLoanIds] = useState<Set<number>>(new Set());

// Can repay multiple loans simultaneously
- Add loan ID to Set when repaying
- Remove from Set on success/error
- Only specific loan button disabled
```

## Database Schema
```sql
loans (
  id SERIAL PRIMARY KEY,
  lender_id INTEGER REFERENCES users(id),
  borrower_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  amount_repaid DECIMAL(10,2) DEFAULT 0.00,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  repaid_at TIMESTAMP
)

loan_repayments (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER REFERENCES loans(id),
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Loan Status
- **Active** - Outstanding debt, not fully repaid
- **Repaid** - Fully repaid
- **Defaulted** - Past due (planned)
- **Forgiven** - Lender forgave debt (planned)

## Loan Calculations
```python
def remaining_balance(loan):
    return loan.amount - loan.amount_repaid

def is_fully_repaid(loan):
    return loan.amount_repaid >= loan.amount

def repayment_progress(loan):
    return (loan.amount_repaid / loan.amount) * 100
```

## Security Features
- Lender balance verification
- Borrower balance verification for repayments
- Self-lending prevention
- Negative amount validation
- Over-repayment prevention

## UI/UX Features
- Tabbed interface (Given/Received)
- Progress indicators for repayments
- Remaining balance display
- Toast notifications
- Loading states per loan
- Empty states for no loans
- Smooth animations
- Color-coded status badges

## Integration Points
- **Wallet**: Transfers funds between users
- **Transactions**: Creates transaction records
- **Notifications**: Notifies about loans and repayments (planned)
- **Profile**: Credit score based on repayment history (planned)

## Loan Flow

### Creating a Loan (Lender)
1. Enter borrower's username
2. Enter loan amount
3. Add description (optional)
4. System verifies lender has funds
5. Funds transferred to borrower
6. Loan record created

### Repaying a Loan (Borrower)
1. View received loans
2. Click "Repay Loan"
3. Enter repayment amount
4. System verifies borrower has funds
5. Funds transferred to lender
6. Loan record updated
7. If fully repaid, status changed to "repaid"

## Error Handling
- Insufficient lender balance
- Insufficient borrower balance for repayment
- Borrower not found
- Self-lending attempt
- Invalid loan ID
- Negative amount validation
- Over-repayment validation

## Trust System (Planned)
- Repayment rate percentage
- On-time repayment tracking
- Credit score calculation
- Lending limits based on score

## Future Enhancements
- [ ] Loan due dates and reminders
- [ ] Interest rates (optional)
- [ ] Installment plans
- [ ] Auto-repayment from wallet
- [ ] Loan agreements (T&C)
- [ ] Dispute resolution
- [ ] Loan forgiveness option
- [ ] Credit score system
- [ ] Lending limits per user
- [ ] Late payment fees
- [ ] Loan history export
- [ ] Analytics for lenders
- [ ] Borrower credit history
- [ ] Loan guarantors
- [ ] Group loans (multiple lenders)
