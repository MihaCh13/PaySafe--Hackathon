# StudentKlombaTest Account - Comprehensive Test Data Seeder

## Overview

This seeder populates **complete test data** for the `StudentKlombaTest@test.com` account across **all UniPay features**:

- ✅ User Account & Wallet
- ✅ Transfers (Incoming & Outgoing)
- ✅ Budget Cards with Transaction History
- ✅ Activity/Transactions History
- ✅ Goals & Savings
- ✅ Dark Days Pocket with Auto-Save
- ✅ Marketplace Listings
- ✅ Loans (Pending, Owed to Me, I Owe, History)

---

## Quick Start

### Run the Seeder

```bash
python backend/seed_student_klomba_full.py
```

**Expected Output:**
```
======================================================================
STUDENT KLOMBA TEST DATA SEEDER
======================================================================

📝 Step 1: Creating/Getting StudentKlombaTest account...
   ✅ Created user: StudentKlombaTest@test.com (ID: 20, Balance: $2500)

💸 Step 2: Creating Transfers (Incoming & Outgoing)...
   ✅ Created 4 incoming transfers
   ✅ Created 3 outgoing transfers

💳 Step 3: Creating Budget Cards...
   ✅ Created 4 budget cards
   ✅ Added 7 transactions to budget cards

📈 Step 4: Creating Activity & Transaction History...
   ✅ Created 10 historical transactions
   ✅ Created 3 upcoming payment reminders

🎯 Step 5: Creating Savings Goals...
   ✅ Created 3 savings goals

🏦 Step 6: Creating Dark Days Pocket...
   ✅ Created Dark Days Pocket (Balance: $750, Auto-save: 20%)

🛒 Step 7: Creating Marketplace Listings...
   ✅ Created 4 marketplace listings

💰 Step 8: Creating Loans (Pending, Owed to Me, I Owe, History)...
   ✅ Created 2 pending loan requests
   ✅ Created 2 active loans (Owed to Me)
   ✅ Created 2 active loans (I Owe)
   ✅ Created 3 completed/cancelled loans (History)

======================================================================
✅ DATA SEEDING COMPLETED SUCCESSFULLY!
======================================================================
```

---

## Login Credentials

**Email:** `StudentKlombaTest@test.com`  
**Password:** `password123`  
**PIN:** `1234`

---

## What Gets Created

### 1. 💸 Transfers (7 total)

#### Incoming Transfers (4):
- **$150.00** - "Rent split - September" from testuser (85 days ago)
- **$75.50** - "Dinner payment" from demouser (45 days ago)
- **$200.00** - "Concert ticket reimbursement" from alice (30 days ago)
- **$50.00** - "Book purchase" from bob (15 days ago)

#### Outgoing Transfers (3):
- **$100.00** - "Monthly subscription share" to testuser (60 days ago)
- **$125.00** - "Study materials" to demouser (40 days ago)
- **$80.00** - "Birthday gift contribution" to alice (20 days ago)

---

### 2. 💳 Budget Cards (4 cards)

| Card Name | Category | Icon | Allocated | Spent | Remaining |
|-----------|----------|------|-----------|-------|-----------|
| Food & Drink | Food & Dining | 🍔 | $500.00 | $325.50 | $174.50 |
| Entertainment | Entertainment | 🎬 | $200.00 | $145.00 | $55.00 |
| Savings Card | Savings | 💰 | $300.00 | $0.00 | $300.00 |
| Transport | Transportation | 🚗 | $150.00 | $87.25 | $62.75 |

**Transaction History (7 transactions):**
- Grocery Store - $85.50
- Restaurant Dinner - $120.00
- Coffee Shop - $45.00
- Movie Tickets - $75.00
- Concert - $70.00
- Gas Station - $50.00
- Uber - $37.25

---

### 3. 📊 Activity & Transactions

#### Historical Transactions (10):
- **Income (3):** Monthly Scholarship - $1,500 (90, 60, 30 days ago)
- **Expenses (4):** 
  - Textbooks & Materials - $250
  - Utility Bills - $180
  - Phone Bill - $95
  - Gym Membership - $120
- **Payments (3):** Rent Payment - $450 (65, 35, 5 days ago)

#### Upcoming Payments (3 reminders):
- Rent Payment - $450 (due in 5 days)
- Electricity Bill - $85 (due in 10 days)
- Internet Subscription - $50 (due in 15 days)

---

### 4. 🎯 Savings Goals (3 goals)

| Goal | Target | Current | Progress | Target Date |
|------|--------|---------|----------|-------------|
| 💻 Laptop Fund | $2,000 | $850 | 42.5% | +120 days |
| ✈️ Travel Fund | $3,000 | $1,200 | 40% | +180 days |
| 🏦 Emergency Fund | $5,000 | $2,300 | 46% | +365 days |

---

### 5. 🏦 Dark Days Pocket

- **Current Balance:** $750.00
- **Goal Amount:** $3,000.00
- **Progress:** 25%
- **Auto-Save:** Enabled (20% of income)
- **Frequency:** Monthly
- **Next Auto-Save:** +30 days

---

### 6. 🛒 Marketplace Listings (4 items)

| Item | Category | Price | Condition | Status |
|------|----------|-------|-----------|--------|
| Introduction to Algorithms Textbook | Books | $45.00 | Like New | Available |
| Scientific Calculator TI-84 | Electronics | $80.00 | Excellent | Available |
| Desk Lamp - Study Light | Furniture | $25.00 | Good | Available |
| Python Programming Course Notes | Notes | $15.00 | Good | Sold |

---

### 7. 💰 Loans (9 total)

#### Pending Requests (2):
1. **Borrowing $250** from admin - "Semester books purchase" (due in 60 days)
2. **Lending $100** to alice - "Event ticket advance" (due in 30 days)

#### Owed to Me (2 active):
1. **student owes $100** ($50 repaid) - "Library membership fee" (due in 45 days)
2. **demo owes $100** ($100 repaid) - "Laptop repair costs" (due in 30 days)

#### I Owe (2 active):
1. **Owe testuser $150** ($150 repaid) - "Course registration emergency" (due in 40 days)
2. **Owe demouser $100** ($75 repaid) - "Medical expenses" (due in 25 days)

#### History (3 completed/cancelled):
1. **Completed:** bob repaid $120 - "Textbook purchase"
2. **Completed:** Repaid eve $200 - "Internship travel costs"
3. **Cancelled:** frank $50 - "Group project expenses"

---

## Database Verification

### Check Account Summary:
```sql
SELECT 
  u.id, u.email, u.username,
  w.balance as wallet_balance,
  (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) as transaction_count,
  (SELECT COUNT(*) FROM virtual_cards WHERE user_id = u.id AND card_purpose = 'budget') as budget_cards,
  (SELECT COUNT(*) FROM goals WHERE user_id = u.id) as goals_count,
  (SELECT COUNT(*) FROM savings_pockets WHERE user_id = u.id) as savings_pockets,
  (SELECT COUNT(*) FROM marketplace_listings WHERE seller_id = u.id) as marketplace_listings,
  (SELECT COUNT(*) FROM loans WHERE lender_id = u.id OR borrower_id = u.id) as loans_count
FROM users u
LEFT JOIN wallets w ON w.user_id = u.id
WHERE u.email = 'StudentKlombaTest@test.com';
```

### Check Loans Breakdown:
```sql
SELECT status, COUNT(*) as count
FROM loans
WHERE lender_id = (SELECT id FROM users WHERE email = 'StudentKlombaTest@test.com')
   OR borrower_id = (SELECT id FROM users WHERE email = 'StudentKlombaTest@test.com')
GROUP BY status;
```

---

## File Location

**Seeder Script:** `backend/seed_student_klomba_full.py`

---

## For New Repository Clones

When someone clones the repository, they should:

1. **Set up the database:**
   ```bash
   python backend/run.py
   # This will create all tables
   ```

2. **Seed base users:**
   ```bash
   python backend/seed_extended_users.py
   ```

3. **Seed merchants:**
   ```bash
   python backend/seed_merchants.py
   ```

4. **Generate transaction history:**
   ```bash
   echo "CONFIRM" | python backend/generate_transaction_history.py --live
   ```

5. **Seed StudentKlombaTest account:**
   ```bash
   python backend/seed_student_klomba_full.py
   ```

---

## Testing the Data

After seeding, you can test all features:

1. **Login** with `StudentKlombaTest@test.com` / `password123`

2. **Dashboard** - View balance ($2,500) and recent transactions

3. **Activity** - Check calendar with historical transactions over 6 months

4. **Cards** - View 4 budget cards with transaction history

5. **Savings** - See 3 savings goals with progress bars

6. **Dark Days Pocket** - View emergency fund with auto-save settings

7. **Marketplace** - Browse 4 listings (3 available, 1 sold)

8. **Loans** - Navigate through all 4 tabs:
   - Pending Requests (2 items)
   - Owed to Me (2 active loans)
   - I Owe (2 active loans)
   - History (3 completed/cancelled)

---

## Notes

- All dates are dynamically calculated based on `datetime.utcnow()`
- Running the seeder multiple times will create duplicate data
- The seeder requires at least 10 other users in the database for transfers and loans
- All monetary amounts are in USD
- Transaction metadata includes category, card info, and user references

---

## Troubleshooting

**Error: "Not enough other users"**
- Solution: Run `python backend/seed_extended_users.py` first

**Error: "User already exists"**
- This is normal - the seeder will skip user creation and seed data only

**Duplicate Data**
- Delete the user and re-run if needed:
  ```sql
  DELETE FROM users WHERE email = 'StudentKlombaTest@test.com';
  ```

---

## Related Seeders

- `backend/seed_extended_users.py` - Creates 16+ test users
- `backend/seed_merchants.py` - Creates 61 merchant partners
- `backend/generate_transaction_history.py` - Generates 6 months of transactions
- `backend/generate_upcoming_payments.py` - Creates scheduled payments

---

**Created:** November 10, 2025  
**Author:** Replit Agent  
**Version:** 1.0.0
