# ISIC Student Discounts Feature

**Status:** 🚧 **IN PROGRESS**

## Overview
The ISIC (International Student Identity Card) integration provides automatic student discount detection and application for both online and physical payments. Students can link their ISIC profile to their digital wallet and receive notifications when making payments at partner merchants.

## Purpose
- Link ISIC student card to digital wallet
- Auto-detect partner merchants offering student discounts
- Provide real-time discount notifications during payment
- Display digital ISIC card for verification
- Support both online and physical (NFC) merchant recognition
- Automatically apply discounts when possible

## Location
- **Frontend:** `src/features/isic/`
- **Backend:** `backend/app/blueprints/isic.py`
- **Models:** `backend/app/models/isic_profile.py`, `backend/app/models/merchant.py`

## Expected Functionalities

### 1. ISIC Profile Management
**Status:** 📋 PENDING

#### Components:
- **ISICProfileSetup** - Initial ISIC card linking form
- **ISICCardDisplay** - Digital ISIC card visualization
- **ISICProfileSettings** - Manage linked ISIC profile

#### Functionality:
- [x] Link ISIC profile to user wallet
- [x] Store ISIC card details (number, expiry, university)
- [x] Digital card display with QR code
- [ ] Verify ISIC card validity with ISIC API
- [x] Update/unlink ISIC profile

#### Implementation Details:
```typescript
interface ISICProfile {
  id: number;
  user_id: number;
  isic_number: string;
  student_name: string;
  university: string;
  expiry_date: string;
  is_verified: boolean;
  qr_code_data: string;
  created_at: string;
}
```

### 2. Partner Merchant Database
**Status:** 📋 PENDING

#### Components:
- **MerchantList** - Browse partner merchants
- **MerchantCard** - Display merchant info and discounts
- **MerchantMap** - Geographic view of nearby partners (future)

#### Functionality:
- [x] Predefined merchant database (KFC, McDonald's, bookstores, etc.)
- [x] Merchant categorization (Food, Retail, Sports, Education)
- [x] Store online identifiers (domain, URL patterns)
- [x] Store physical identifiers (POS ID, Merchant ID)
- [x] Discount percentage/amount per merchant
- [ ] Real-time merchant updates via API
- [ ] User-submitted merchant suggestions

#### Merchant Schema:
```python
class Merchant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))  # Food, Retail, Sports, Education
    logo_url = db.Column(db.String(255))
    discount_percentage = db.Column(db.Float)  # e.g., 15.0 for 15%
    discount_description = db.Column(db.String(255))
    
    # Online Recognition
    online_domain = db.Column(db.String(100))  # e.g., 'kfc.com'
    online_url_patterns = db.Column(db.JSON)  # List of URL patterns
    
    # Physical Recognition (NFC/POS)
    pos_merchant_id = db.Column(db.String(100))
    nfc_enabled = db.Column(db.Boolean, default=False)
    
    # Discount Application
    auto_apply_online = db.Column(db.Boolean, default=False)
    requires_verification = db.Column(db.Boolean, default=True)
```

#### Predefined Merchants:
- **Food & Beverage**: KFC, McDonald's, Starbucks, Subway
- **Retail**: Bookstores, Tech stores, Clothing shops
- **Sports**: Gyms, Sports facilities, Equipment stores
- **Education**: Online courses, Software licenses
- **Entertainment**: Cinemas, Museums, Theaters
- **Transport**: Bus, Train, Airlines (student fares)

### 3. Online Payment Recognition
**Status:** 📋 PENDING

#### Components:
- **OnlinePaymentDetector** - URL/domain matching service
- **DiscountNotification** - Alert component for detected discounts

#### Functionality:
- [x] Intercept online payment requests
- [x] Extract payment domain/URL from transaction
- [x] Compare with merchant database `online_domain` field
- [x] Match URL patterns for accuracy
- [x] Show discount notification if match found
- [x] Auto-apply discount if `auto_apply_online = true`
- [ ] Redirect to merchant discount page if needed

#### Flow:
```
User initiates online payment
    ↓
Extract payment URL/domain
    ↓
Query merchant database
    ↓
If match found → Show notification
    ↓
If auto_apply_online → Apply discount automatically
    ↓
Else → Prompt user to show ISIC card
```

### 4. Physical Payment Recognition (NFC)
**Status:** 📋 PENDING

#### Components:
- **NFCPaymentDetector** - Simulated NFC terminal reader
- **PaymentBlockModal** - Block payment and show discount alert
- **ISICCardQuickShow** - Quick-access card display

#### Functionality:
- [x] Simulate NFC read from payment terminal
- [x] Extract Merchant ID/Name from NFC data
- [x] Compare with `pos_merchant_id` in database
- [x] Block payment if match found
- [x] Show prominent notification about student discount
- [x] Provide "Show ISIC Card" button
- [ ] Resume payment after card shown
- [ ] Actual NFC integration (Web NFC API)

#### Flow:
```
User taps card/phone for payment
    ↓
NFC reads terminal Merchant ID
    ↓
Query merchant database
    ↓
If match found → BLOCK payment
    ↓
Show notification: "You have a student discount!"
    ↓
Display "Show ISIC Card" button
    ↓
User shows digital card
    ↓
Cashier applies discount
    ↓
Resume payment with discounted amount
```

### 5. Discount Notification System
**Status:** 📋 PENDING

#### Components:
- **DiscountAlert** - Full-screen discount notification
- **DiscountBanner** - Non-intrusive banner notification
- **DiscountHistory** - Track applied discounts

#### Functionality:
- [x] Detect payment scenario (online vs. physical)
- [x] Show context-appropriate notification
- [x] Provide "Show ISIC Card" action button
- [x] Display merchant discount details
- [x] Track notification interactions
- [x] Log applied discounts for history
- [ ] Push notifications for nearby partner merchants

#### Notification Types:
1. **Online Payment Alert** (Banner)
   - "15% student discount available at [Merchant]"
   - Action: "Apply Discount" or "Continue"

2. **Physical Payment Alert** (Full-screen modal)
   - "⚠️ STUDENT DISCOUNT DETECTED"
   - "Show your ISIC card to get 15% off"
   - Action: "Show Card" button

3. **Discount Applied Confirmation** (Toast)
   - "✅ Student discount applied: -$5.00"

### 6. Digital ISIC Card Display
**Status:** 📋 PENDING

#### Components:
- **ISICCardFull** - Full-screen digital card
- **ISICCardCompact** - Widget-sized card
- **ShowCardButton** - Quick access button

#### Functionality:
- [x] Display ISIC card with student details
- [x] Generate QR code for verification
- [x] Adjustable brightness for scanning
- [x] Card expiry warning
- [x] Quick-access from payment flow
- [ ] NFC transmission of card data
- [ ] Barcode/QR code scanning by merchant

#### Card Information Displayed:
- Student name
- University/Institution
- ISIC card number
- Expiry date
- Student photo (optional)
- QR code for verification
- Validity indicator

### 7. Automatic Discount Application
**Status:** 📋 PENDING

#### Functionality:
- [x] Online merchants with `auto_apply_online = true`
- [x] Calculate discount amount automatically
- [x] Modify transaction amount before submission
- [x] Show confirmation of applied discount
- [x] Log discount application in transaction
- [ ] Validate discount eligibility
- [ ] Handle discount redemption limits

#### Business Logic:
```python
def apply_discount(transaction_amount, merchant_id, isic_profile_id):
    merchant = Merchant.query.get(merchant_id)
    isic = ISICProfile.query.get(isic_profile_id)
    
    if not isic.is_verified or isic.is_expired():
        return None
    
    discount_amount = transaction_amount * (merchant.discount_percentage / 100)
    final_amount = transaction_amount - discount_amount
    
    # Log discount application
    log_discount_usage(isic_profile_id, merchant_id, discount_amount)
    
    return final_amount
```

### 8. Merchant Detection Integration
**Status:** 📋 PENDING

#### Payment Flow Integration:
- **Before Top-up**: No merchant detection
- **Before Transfer**: No merchant detection
- **Before Virtual Card Payment**: Detect merchant, show notification
- **Before Marketplace Purchase**: Check if seller is partner merchant

#### Detection Priority:
1. Check if user has linked ISIC profile
2. Check if ISIC card is valid (not expired)
3. Extract merchant identifier (URL or NFC data)
4. Query merchant database
5. If match found, trigger notification
6. Allow user to show card or proceed without discount

## Backend API Endpoints

### ISIC Profile Management
```python
POST   /api/isic/profile          # Link ISIC profile
GET    /api/isic/profile          # Get linked profile
PUT    /api/isic/profile          # Update profile
DELETE /api/isic/profile          # Unlink profile
POST   /api/isic/verify           # Verify ISIC card validity
```

### Merchant Management
```python
GET    /api/isic/merchants                    # List all partner merchants
GET    /api/isic/merchants?category=Food      # Filter by category
GET    /api/isic/merchants/:id                # Get merchant details
POST   /api/isic/merchants/detect-online      # Detect merchant by URL
POST   /api/isic/merchants/detect-physical    # Detect merchant by NFC data
```

### Discount Operations
```python
POST   /api/isic/discounts/check              # Check discount availability
POST   /api/isic/discounts/apply              # Apply discount to transaction
GET    /api/isic/discounts/history            # Get discount usage history
GET    /api/isic/discounts/savings            # Total savings statistics
```

## Database Schema

### isic_profiles
```sql
CREATE TABLE isic_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    isic_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    university VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    qr_code_data TEXT,
    photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### merchants
```sql
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    logo_url VARCHAR(255),
    discount_percentage DECIMAL(5,2),
    discount_description VARCHAR(255),
    online_domain VARCHAR(100),
    online_url_patterns JSONB,
    pos_merchant_id VARCHAR(100),
    nfc_enabled BOOLEAN DEFAULT FALSE,
    auto_apply_online BOOLEAN DEFAULT FALSE,
    requires_verification BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### discount_applications
```sql
CREATE TABLE discount_applications (
    id SERIAL PRIMARY KEY,
    isic_profile_id INTEGER NOT NULL REFERENCES isic_profiles(id),
    merchant_id INTEGER NOT NULL REFERENCES merchants(id),
    transaction_id INTEGER REFERENCES transactions(id),
    original_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    detection_method VARCHAR(20) NOT NULL, -- 'online' or 'physical'
    applied_at TIMESTAMP DEFAULT NOW()
);
```

## User Flows

### Flow 1: Link ISIC Profile
```
1. User navigates to ISIC Card page
2. Clicks "Link ISIC Card"
3. Enters ISIC number, university, expiry date
4. System validates format
5. Generates QR code
6. Profile saved, user sees digital card
```

### Flow 2: Online Payment with Discount
```
1. User initiates online payment (e.g., KFC delivery)
2. System extracts domain "kfc.com"
3. Matches with merchant database
4. Shows banner: "15% student discount available"
5. User clicks "Apply Discount"
6. Transaction amount reduced automatically
7. Confirmation shown: "Discount applied: -$3.50"
8. Payment proceeds with discounted amount
```

### Flow 3: Physical Payment with Discount
```
1. User attempts to pay at McDonald's POS
2. Taps card/phone (NFC simulation)
3. System reads Merchant ID from terminal
4. Matches with McDonald's in database
5. BLOCKS payment, shows full-screen alert
6. "⚠️ You have a 10% student discount!"
7. User clicks "Show ISIC Card"
8. Full-screen digital card displayed
9. Cashier verifies, applies discount manually
10. User completes payment with discount
```

### Flow 4: Browse Partner Merchants
```
1. User navigates to ISIC Discounts page
2. Sees list of partner merchants
3. Filters by category (Food, Retail, etc.)
4. Clicks on merchant for details
5. Views discount amount and terms
6. Sees locations/online platforms
```

## Components Structure

```
src/features/isic/
├── pages/
│   ├── ISICCardPage.tsx           # Main ISIC card display page
│   └── MerchantsPage.tsx          # Browse partner merchants
├── components/
│   ├── ISICCardFull.tsx           # Full-screen digital card
│   ├── ISICCardCompact.tsx        # Widget card display
│   ├── ISICProfileSetup.tsx       # Link ISIC form
│   ├── MerchantList.tsx           # List of partner merchants
│   ├── MerchantCard.tsx           # Individual merchant card
│   ├── DiscountAlert.tsx          # Full-screen discount notification
│   ├── DiscountBanner.tsx         # Banner notification
│   ├── PaymentBlockModal.tsx     # Block payment for physical discount
│   ├── ShowCardButton.tsx         # Quick-access button
│   ├── OnlinePaymentDetector.tsx  # URL matching logic
│   ├── NFCPaymentDetector.tsx     # NFC simulation
│   └── DiscountHistory.tsx        # Discount usage history
└── hooks/
    ├── useISICProfile.ts          # ISIC profile state
    ├── useMerchantDetection.ts    # Merchant detection logic
    └── useDiscountApplication.ts  # Discount application logic
```

## Implementation Status

### Backend (📋 PENDING)
- [ ] ISICProfile model
- [ ] Merchant model
- [ ] DiscountApplication model
- [ ] ISIC profile API endpoints
- [ ] Merchant management endpoints
- [ ] Discount detection logic
- [ ] Merchant database seed data

### Frontend (📋 PENDING)
- [ ] ISICCardPage with digital card display
- [ ] MerchantsPage with partner list
- [ ] ISIC profile linking form
- [ ] Online payment detection
- [ ] Physical payment detection (NFC simulation)
- [ ] Discount notification components
- [ ] Integration with payment flows

### Integration (📋 PENDING)
- [ ] Link to wallet/transactions
- [ ] Payment flow hooks
- [ ] Navigation menu item
- [ ] Notification system integration
- [ ] Analytics for discount usage

## Technical Considerations

### Security
- ISIC card numbers must be encrypted at rest
- Verify ISIC validity before applying discounts
- Rate limiting on discount applications
- Prevent duplicate discount claims

### Performance
- Cache merchant database for quick lookups
- Index online_domain and pos_merchant_id columns
- Optimize URL pattern matching algorithm

### User Experience
- Non-intrusive notifications for online payments
- Clear, bold alerts for physical payments
- Quick "Show Card" access from anywhere
- Visual feedback for applied discounts

### Future Enhancements
- [ ] Real NFC integration (Web NFC API)
- [ ] Integration with actual ISIC API for verification
- [ ] Geolocation-based merchant suggestions
- [ ] In-app merchant map
- [ ] Loyalty points for discount usage
- [ ] Merchant partnership program
- [ ] Discount expiration tracking
- [ ] Monthly savings reports

## Notes
- Physical payment detection uses NFC simulation initially
- Real NFC requires Web NFC API support (limited browser compatibility)
- Auto-apply discounts should be opt-in for security
- Merchants marked with `requires_verification` need manual card showing
- Consider GDPR compliance for student data storage
