# P2P Borrow/Lend System

## Overview
The P2P (Peer-to-Peer) Borrow/Lend system enables students to borrow and lend money to friends, classmates, and roommates within the UniPay ecosystem. It provides a transparent debt tracking system, easy loan request methods (QR code, username, contact), automated reminders, and complete repayment history.

## Core Functionalities

### 1. Send Loan Request ✅ DONE
**Purpose**: Enable students to request loans from friends easily

**Request Methods**:

**A. QR Code Loan Request** ✅
- User generates QR code with loan details
- QR contains: amount, reason, repayment deadline
- Friend scans QR → sees loan request → approves/declines
- Instant loan transfer upon approval

**B. Username/Email Request** ✅
- Search for friend by username or email
- Enter loan amount and reason
- Send request notification
- Friend receives in-app notification

**C. Contact List Request** 📋 (Future)
- Access phone contacts (with permission)
- Select contact to request loan
- Send SMS/WhatsApp link if not on UniPay
- Invite to app if not registered

**Loan Request Details**:
- Amount (min $5, max $500 per loan)
- Reason/description (required, 10-200 chars)
- Repayment deadline (optional)
- Interest rate (optional, 0-10% APR)
- Collateral/notes (optional)

**Request States**:
- **Pending**: Sent, awaiting response
- **Approved**: Accepted, funds transferred
- **Declined**: Rejected by lender
- **Cancelled**: Withdrawn by requester
- **Expired**: No response within 7 days

**Status**: ✅ **IMPLEMENTED**
- LoanRequestModal with all request methods
- QR code generation with loan details
- Username search functionality
- Validation and amount limits

---

### 2. Debt Tracker ✅ DONE
**Purpose**: Comprehensive overview of all active debts

**Two-Tab System**:

**Tab 1: "Owed to Me" (I am the lender)**
Shows all money others owe you:
- Borrower name and profile picture
- Amount owed
- Original loan amount
- Amount already repaid (if partial)
- Days since loan issued
- Repayment deadline
- Interest accrued (if applicable)
- Overdue badge if past deadline
- Actions: Send Reminder, Mark as Paid, View Details

**Tab 2: "I Owe" (I am the borrower)**
Shows all money you owe to others:
- Lender name and profile picture
- Amount owed
- Original loan amount
- Amount already repaid (if partial)
- Days since loan received
- Repayment deadline
- Interest owed (if applicable)
- Overdue warning if past deadline
- Actions: Make Repayment, Request Extension, View Details

**Debt Summary Cards**:
- **Total Owed to Me**: Sum of all active debts from others
- **Total I Owe**: Sum of all active debts to others
- **Net Balance**: (Owed to Me) - (I Owe)
- **Overdue Count**: Number of overdue loans

**Filtering & Sorting**:
- Filter by: All, Overdue, Large Amounts (>$100), Small (<$50)
- Sort by: Amount (high to low), Date (oldest first), Deadline (urgent first)

**Status**: ✅ **IMPLEMENTED**
- DebtTracker with two-tab system
- Summary cards with calculations
- Debt cards showing all details
- Overdue badges and warnings

---

### 3. Debt Reminders ✅ DONE
**Purpose**: Gently remind borrowers to repay debts

**Manual Reminders**:
- "Send Reminder" button on each debt card
- Pre-written friendly messages:
  - "Hey! Just a friendly reminder about the $50 loan 😊"
  - "Hi! The repayment deadline is coming up soon"
  - "Hope you're doing well! Reminder about our loan agreement"
- Custom message option
- Cooldown: 1 reminder every 24 hours per loan
- Reminder history: Track when reminders were sent

**Automated Reminders** 📋 (Future):
- 3 days before deadline: "Heads up! Repayment due soon"
- On deadline day: "Today is the repayment deadline"
- 1 day after overdue: "Gentle reminder: payment is overdue"
- Weekly reminders for overdue debts
- Escalation path for long overdue (30+ days)

**Reminder Notifications**:
- In-app notification
- Push notification (if enabled)
- Email (optional)
- SMS (for important/overdue only)

**Reminder Analytics**:
- Number of reminders sent
- Response rate (did they pay after reminder?)
- Average days to payment after reminder

**Status**: ✅ **IMPLEMENTED**
- Send Reminder button on debt cards
- Pre-written message templates
- Cooldown enforcement
- Toast notifications

---

### 4. Repayment System ✅ DONE
**Purpose**: Easy, trackable loan repayments

**Repayment Methods**:

**A. Full Repayment** ✅
- "Pay Now" button
- Confirms full amount + interest
- Deducts from wallet
- Transfers to lender
- Updates debt status to "Repaid"
- Sends notification to lender

**B. Partial Repayment** ✅
- "Pay Partial" button
- Enter custom amount
- Must be at least $5
- Updates remaining balance
- Tracks repayment history
- Notifies lender of payment

**C. Repayment Plan** 📋 (Future)
- Split repayment into installments
- Weekly/monthly schedule
- Auto-deduct on schedule
- Notifications before each payment

**Repayment Confirmation**:
- Shows amount being paid
- Shows new remaining balance
- Displays interest if applicable
- Requires wallet balance check
- Prevents overdraft
- Two-step confirmation for large amounts (>$100)

**Status**: ✅ **IMPLEMENTED**
- RepaymentModal component
- Full and partial repayment options
- Wallet balance validation
- Repayment history tracking

---

### 5. Loan History ✅ DONE
**Purpose**: Complete record of all past loans

**History Tabs**:

**Tab 1: Loans I Gave (Repaid)**
- List of all loans you gave that were fully repaid
- Borrower name
- Original amount
- Repayment date
- Days to repayment
- Interest earned (if any)
- Rating/review of borrower (optional)

**Tab 2: Loans I Took (Repaid)**
- List of all loans you took that were fully repaid
- Lender name
- Original amount
- Repayment date
- Days to repayment
- Interest paid (if any)
- Rating/review of lender (optional)

**History Cards**:
- Profile picture + name
- Amount badge
- Repayment date
- Duration (e.g., "Repaid in 14 days")
- Status badge: "Repaid on Time" or "Repaid Late"
- Interest amount (if applicable)
- Transaction ID

**Search & Filter**:
- Search by name
- Filter by date range
- Filter by amount range
- Filter by on-time vs late
- Export to CSV

**Statistics**:
- Total money lent (all time)
- Total money borrowed (all time)
- Average repayment time
- On-time repayment rate
- Total interest earned/paid
- Most frequent borrower/lender

**Status**: ✅ **IMPLEMENTED**
- LoanHistory component with tabs
- Repaid loan cards with all details
- Statistics summary
- Date formatting and calculations

---

### 6. QR Code System ✅ DONE
**Purpose**: Quick, contactless loan requests

**QR Code Generation**:
- User creates loan request
- System generates unique QR code
- QR contains encrypted loan data:
  - Requester ID
  - Amount
  - Reason
  - Deadline
  - Unique request ID
- Can save QR as image
- Can share QR via messaging apps

**QR Code Scanning** 📋 (Future):
- Open QR scanner in app
- Scan friend's loan request QR
- See loan details
- Approve/decline immediately
- Funds transfer instantly upon approval

**QR Code Design**:
- UniPay logo in center
- Color-coded by amount:
  - Green: <$50
  - Blue: $50-$150
  - Orange: $150-$300
  - Red: >$300
- Shows amount prominently
- Expiry timer (24 hours)

**Use Cases**:
- In-person loan requests
- Group study sessions
- Roommate bill splits
- Emergency situations
- No need to type anything

**Status**: ✅ **IMPLEMENTED**
- QRCodeDisplay component
- QR generation with loan details
- Visual design with logo
- Share/save functionality

---

## Database Schema

### Loans Table
```sql
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    lender_id INTEGER REFERENCES users(id),
    borrower_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    remaining_balance DECIMAL(10, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 0.00,
    reason TEXT NOT NULL,
    deadline DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, repaid, defaulted
    created_at TIMESTAMP DEFAULT NOW(),
    repaid_at TIMESTAMP,
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_balance CHECK (remaining_balance >= 0)
);
```

### Loan Requests Table
```sql
CREATE TABLE loan_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id),
    recipient_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    deadline DATE,
    interest_rate DECIMAL(5, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, declined, cancelled, expired
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    qr_code TEXT, -- QR code data if generated
    CONSTRAINT positive_amount CHECK (amount > 0)
);
```

### Repayments Table
```sql
CREATE TABLE repayments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT positive_amount CHECK (amount > 0)
);
```

### Reminders Table
```sql
CREATE TABLE loan_reminders (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES loans(id),
    sent_by INTEGER REFERENCES users(id),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Existing Endpoints
- None currently implemented for P2P lending

### New Endpoints Required

**GET** `/api/loans` 📋
- Fetch user's loans (both given and received)
- Query: `?type=lent|borrowed&status=active|repaid`
- Returns: Array of loan objects

**POST** `/api/loans/request` 📋
- Create new loan request
- Body: `{ recipient_id, amount, reason, deadline?, interest_rate? }`
- Returns: Created loan request with QR code

**POST** `/api/loans/request/:id/approve` 📋
- Approve loan request
- Transfers funds from lender to borrower
- Creates active loan record
- Returns: Active loan object

**POST** `/api/loans/request/:id/decline` 📋
- Decline loan request
- Updates status to declined
- Notifies requester

**POST** `/api/loans/:id/repay` 📋
- Make loan repayment (full or partial)
- Body: `{ amount }`
- Deducts from borrower wallet
- Transfers to lender wallet
- Returns: Updated loan + repayment record

**POST** `/api/loans/:id/remind` 📋
- Send payment reminder to borrower
- Body: `{ message? }`
- Creates reminder record
- Sends notification
- Returns: Reminder object

**GET** `/api/loans/:id/history` 📋
- Get repayment history for specific loan
- Returns: Array of repayment records

**GET** `/api/loans/stats` 📋
- Get user's lending statistics
- Returns: Total lent, borrowed, on-time rate, etc.

---

## UI Components

### Created Components

✅ **LoansPage**
- Main P2P lending dashboard
- Two-tab system: "Owed to Me" / "I Owe"
- Summary cards (total owed, total owing, net balance)
- "Request Loan" and "Lend Money" buttons
- Debt tracker with all active loans
- Loan history section

✅ **LoanRequestModal**
- Form to create loan request
- Recipient selection (username search)
- Amount input ($5-$500 validation)
- Reason/description field
- Optional deadline picker
- Optional interest rate
- QR code generation option
- Submit button

✅ **DebtCard**
- Individual debt display
- User profile + name
- Amount owed/owing
- Original amount vs remaining
- Days since loan / deadline countdown
- Overdue badge if applicable
- Action buttons:
  - For "Owed to Me": Send Reminder, Mark Paid
  - For "I Owe": Make Repayment, Request Extension

✅ **RepaymentModal**
- Loan summary
- Current balance owed
- Wallet balance display
- Repayment amount input
- Full/partial repayment toggle
- Interest calculation display
- Confirm repayment button

✅ **QRCodeDisplay**
- QR code visualization
- Loan amount prominently shown
- Expiry timer
- Save as image button
- Share button
- Color-coded border by amount

✅ **LoanHistoryList**
- List of repaid loans
- Filter by date range
- Repaid loan cards
- Statistics summary
- Export option

✅ **ReminderButton**
- Send reminder action
- Pre-written message templates
- Custom message option
- Cooldown indicator
- Reminder history

### Pending Components

📋 **QRCodeScanner**
- Camera access for QR scanning
- Decode loan request data
- Show approval dialog
- Instant fund transfer

📋 **LoanDetailsModal**
- Full loan information
- Repayment history timeline
- Reminder history
- Interest calculation breakdown
- Export loan details

📋 **RepaymentPlanModal**
- Create installment plan
- Schedule selector (weekly/monthly)
- Auto-payment toggle
- Preview schedule

---

## User Experience Flow

### Creating a Loan Request
1. User clicks "Request Loan" button
2. Modal opens with request form
3. User searches for friend's username
4. Enters amount ($50), reason ("Textbook for CS class")
5. Sets deadline (7 days from now)
6. Option: Generate QR code or send directly
7. If QR: QR code displayed, can share/save
8. If direct: Notification sent to friend
9. Request appears in "Pending Requests" section

### Approving a Loan Request
1. Lender receives notification
2. Opens request details
3. Reviews amount, reason, deadline
4. Checks wallet balance ($200 available)
5. Clicks "Approve Loan"
6. Confirmation: "Transfer $50 to John?"
7. Confirms
8. $50 deducted from wallet
9. $50 added to John's wallet
10. Active loan appears in "Owed to Me" tab

### Making a Repayment
1. Borrower sees loan in "I Owe" tab
2. Loan shows: $50 owed, 3 days until deadline
3. Clicks "Make Repayment"
4. Repayment modal opens
5. Options: Full ($50) or Partial (enter amount)
6. Selects Full repayment
7. Confirms with wallet balance check
8. $50 deducted from wallet
9. $50 transferred to lender
10. Loan moves to "Repaid Loans" history
11. Lender receives payment notification

### Sending a Reminder
1. Lender sees overdue loan in "Owed to Me"
2. Loan is 2 days overdue, $30 remaining
3. Clicks "Send Reminder" button
4. Chooses template: "Gentle reminder about our loan"
5. Sends reminder
6. Borrower receives in-app notification
7. Reminder logged with timestamp
8. Button shows cooldown: "Next reminder available in 23:45"

---

## Security & Privacy

**Fraud Prevention**:
- Maximum loan amount: $500 per request
- Daily lending limit: $1,000
- Daily borrowing limit: $500
- Identity verification required for >$100
- Transaction confirmation emails
- Dispute resolution system

**Privacy Controls**:
- Hide loan history from profile (optional)
- Anonymous lending (username hidden) 📋
- Lending circle visibility (friends only vs public)
- Block/report abusive requesters

**Data Protection**:
- Encrypted loan data in QR codes
- Secure wallet transactions
- Audit trail for all transfers
- GDPR compliance for exports

**Debt Collection**:
- Automated reminder escalation
- After 30 days overdue: "Seriously overdue" status
- After 60 days: Optional dispute filing
- After 90 days: Account restriction (no new loans)
- Community reputation impact

---

## Gamification & Social Features

**Reputation System** 📋 (Future):
- **Borrower Score** (0-100):
  - On-time repayment rate: +10 per loan
  - Late repayments: -5 per occurrence
  - Defaults: -25 per default
- **Lender Score** (0-100):
  - Number of loans given: +2 per loan
  - Fair interest rates: +5 bonus
  - Quick approvals: +3 bonus

**Badges & Achievements**:
- 🌟 First Loan Given/Taken
- 💯 Perfect Repayment (10 loans on time)
- 🤝 Generous Lender (50 loans given)
- ⚡ Quick Repayer (avg <3 days)
- 🏆 Trusted Borrower (100% on-time rate)

**Leaderboards** 📋:
- Most trusted borrowers (campus)
- Most generous lenders (campus)
- Fastest repayers (monthly)

---

## Mobile Responsiveness

### Desktop (≥1024px)
- Three-column layout
- Side-by-side debt cards
- Full QR code scanner
- Detailed statistics dashboard

### Tablet (768px - 1023px)
- Two-column debt cards
- Compact summary cards
- Touch-optimized buttons

### Mobile (<768px)
- Single-column stacked cards
- Bottom sheet modals
- Large touch targets (48px+)
- Swipe actions (swipe to repay/remind)
- QR code full-screen

---

## Accessibility

**Keyboard Navigation**:
- Tab through loans
- Enter to open details
- Space to select actions
- Arrow keys for amount adjustment

**Screen Readers**:
- Debt amounts announced
- Deadlines clearly stated
- Overdue warnings emphasized
- Action button purposes clear

**Visual**:
- High contrast for overdue badges
- Color-blind safe status indicators
- Large, readable amounts
- Clear visual hierarchy

---

## Integration with Other Features

**Wallet Integration**:
- Loan transfers use main wallet
- Balance checks before lending/repaying
- Transaction history includes loans
- Pending loans shown as "reserved funds"

**Notifications**:
- Loan request received
- Request approved/declined
- Repayment received
- Reminder sent/received
- Deadline approaching

**Marketplace Integration** 📋:
- Lend money for marketplace purchases
- Loan specifically for listed item
- Automatic repayment when item sells
- Escrow-style protection

---

## Testing Checklist

### Visual Testing
- [x] Debt cards display correctly
- [x] QR codes generate properly
- [x] Modals open/close smoothly
- [x] Tabs switch correctly
- [x] Overdue badges appear
- [x] Responsive on all screen sizes

### Functional Testing
- [ ] Create loan request
- [ ] Approve/decline request
- [ ] Make full repayment
- [ ] Make partial repayment
- [ ] Send reminder
- [ ] View loan history
- [ ] Generate QR code
- [ ] Search by username

### Integration Testing
- [ ] Wallet balance updates
- [ ] Notifications sent
- [ ] Transaction recorded
- [ ] Deadline calculations
- [ ] Interest accrual

---

## Implementation Priority

### Phase 1 (Current - Visual Components) ✅
- [x] Loans page with debt tracker
- [x] Loan request modal
- [x] Debt cards (owed/owing)
- [x] Repayment modal
- [x] QR code display
- [x] Loan history list
- [x] Reminder button
- [x] Summary statistics

### Phase 2 (API Integration) 📋
- [ ] Create loan request endpoint
- [ ] Approve/decline endpoints
- [ ] Repayment processing
- [ ] Reminder sending
- [ ] Loan history retrieval
- [ ] Statistics calculation

### Phase 3 (Advanced Features) 📋
- [ ] QR code scanning
- [ ] Automated reminders
- [ ] Repayment plans
- [ ] Reputation system
- [ ] Dispute resolution

### Phase 4 (Social Features) 📋
- [ ] Lending circles
- [ ] Community leaderboards
- [ ] Borrower/lender ratings
- [ ] Public loan requests board

---

## Notes
- P2P lending helps students manage informal debts transparently
- Debt tracker prevents "forgetting" about loans
- Reminders are friendly, not aggressive
- System promotes trust and accountability
- QR codes make in-person requests seamless
- Complete history builds reputation over time
- Interest rates optional, encourages friendly lending
- Maximum amounts prevent risky large loans
- Integration with wallet ensures liquidity
