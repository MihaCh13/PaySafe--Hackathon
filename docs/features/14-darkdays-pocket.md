# DarkDays Pocket / Secure Wallet Feature

**Status:** 🚧 **IN DEVELOPMENT** (Basic implementation complete, advanced features pending)

## Overview
DarkDays Pocket is a highly secure savings feature designed to help students build emergency funds and resist impulse spending. It acts as a locked, separate wallet with multi-layer security, automatic savings transfers, and restricted withdrawal access.

## Purpose
- Create a secure emergency fund separate from main wallet
- Automate savings with percentage-based transfers
- Prevent impulsive withdrawals with multi-layer security
- Track savings progress and provide motivational reports
- Provide peace of mind with emergency-only access

## Core Philosophy
> **"For Dark Days Only"** - A financial safety net that's intentionally difficult to access, protecting students from using emergency funds for non-emergencies.

## Location
- **Frontend:** `src/features/savings/pages/SavingsPage.tsx`
- **Backend:** `backend/app/blueprints/savings.py`
- **Model:** `backend/app/models/savings_pocket.py`
- **API:** `src/lib/api.ts` (savingsAPI)

---

## Expected Functionalities

### 1. Locked Pocket / Separate Virtual Card
**Description:** A distinct, isolated savings container separate from the main wallet

**Status:**
- ✅ **[IMPLEMENTED]** - Database model with separate balance
- ✅ **[IMPLEMENTED]** - Basic pocket creation
- ✅ **[IMPLEMENTED]** - Pocket listing and display
- ⏳ **[PENDING]** - Virtual card representation for pocket
- ⏳ **[PENDING]** - "Black card" visual design theme
- ⏳ **[PENDING]** - Restricted area UI (separate section)

**Backend Model Fields:**
```python
- id: Integer (Primary Key)
- user_id: Integer (Foreign Key)
- name: String (default: "DarkDays Pocket")
- balance: Decimal (separate from main wallet)
- is_locked: Boolean (lock status)
- pin_protected: Boolean (PIN requirement)
```

---

### 2. Automatic Percentage Transfers
**Description:** Automatically transfer a percentage of incoming funds to DarkDays Pocket

**Status:**
- ✅ **[IMPLEMENTED]** - Database field: `auto_save_percentage`
- ⏳ **[PENDING]** - Automatic trigger on wallet top-up
- ⏳ **[PENDING]** - Automatic trigger on incoming transfers
- ⏳ **[PENDING]** - Toggle auto-save on/off
- ⏳ **[PENDING]** - Configurable percentage UI (slider/input)
- ⏳ **[PENDING]** - Auto-save transaction logging

**Backend Model Fields:**
```python
- auto_save_enabled: Boolean
- auto_save_percentage: Decimal (e.g., 20%)
```

**Expected Behavior:**
```
User receives $100 salary → 
  → $80 goes to main wallet
  → $20 automatically transferred to DarkDays Pocket
```

---

### 3. Choice of Period (Monthly, Weekly, Fixed Date)
**Description:** Configure when automatic savings transfers occur

**Status:**
- ✅ **[IMPLEMENTED]** - Database field: `auto_save_frequency`
- ✅ **[IMPLEMENTED]** - Database field: `next_auto_save_date`
- ⏳ **[PENDING]** - Frontend UI for period selection
- ⏳ **[PENDING]** - Scheduled job/cron for automatic transfers
- ⏳ **[PENDING]** - Calendar-based date picker for fixed dates

**Backend Model Fields:**
```python
- auto_save_frequency: String ("monthly", "weekly", "fixed_date")
- next_auto_save_date: Date
```

**Expected Options:**
- **Weekly:** Transfer every Monday/Friday/etc.
- **Monthly:** Transfer on 1st/15th/last day of month
- **Fixed Date:** User chooses specific date (e.g., "every 25th")

---

### 4. Multi-layer Security (PIN + Password / Auth Pop-ups)
**Description:** Multiple authentication layers to protect withdrawals

**Status:**
- ✅ **[IMPLEMENTED]** - PIN protection in backend model
- ✅ **[IMPLEMENTED]** - PIN verification on deposit
- ⏳ **[PENDING]** - PIN verification on withdrawal
- ⏳ **[PENDING]** - Password re-authentication requirement
- ⏳ **[PENDING]** - Biometric auth option (future)
- ⏳ **[PENDING]** - 2FA integration (future)
- ⏳ **[PENDING]** - Security confirmation dialogs
- ⏳ **[PENDING]** - Cooling-off period (24-hour withdrawal delay option)

**Backend Model Fields:**
```python
- pin_protected: Boolean (currently always True)
```

**Expected Security Flow:**
```
User requests withdrawal →
  1. Enter PIN
  2. Re-enter password
  3. Confirm "Emergency use only" checkbox
  4. Optional 24-hour cooling period
  5. Withdrawal approved
```

---

### 5. Emergency Unlock Option
**Description:** Special mechanism for genuine emergencies with proper verification

**Status:**
- ⏳ **[PENDING]** - Emergency unlock UI
- ⏳ **[PENDING]** - Emergency reason selection
- ⏳ **[PENDING]** - Multi-step verification process
- ⏳ **[PENDING]** - Emergency unlock logging
- ⏳ **[PENDING]** - Email notification on emergency unlock
- ⏳ **[PENDING]** - Cooldown period after emergency use

**Expected Features:**
- Emergency categories (Medical, Travel, Family, Crisis)
- Reason text field (required)
- Immediate unlock (bypasses cooling period)
- Email/SMS notification sent
- 7-day cooldown before next emergency unlock
- Transaction marked as "emergency withdrawal"

---

### 6. Balance-only View (No Easy Withdrawal)
**Description:** Display balance without prominent withdrawal buttons

**Status:**
- ✅ **[IMPLEMENTED]** - Balance display in UI
- ⏳ **[PENDING]** - Hidden withdrawal button (requires unlock)
- ⏳ **[PENDING]** - "View only" mode toggle
- ⏳ **[PENDING]** - Blur balance option (privacy)
- ⏳ **[PENDING]** - Deposit-only quick actions
- ⏳ **[PENDING]** - Remove tempting UI elements

**Expected UI Behavior:**
- Balance shown prominently
- No "Withdraw" button visible by default
- Must click "Emergency Access" → Verify → Then withdrawal option appears
- Positive reinforcement messages ("You've protected $X!")

---

### 7. Separate Visualization (Black Card / Restricted Area)
**Description:** Distinct visual theme to emphasize security and separation

**Status:**
- ⏳ **[PENDING]** - Black card design
- ⏳ **[PENDING]** - Dark theme for DarkDays section
- ⏳ **[PENDING]** - Lock icon animations
- ⏳ **[PENDING]** - Vault/safe visual metaphor
- ⏳ **[PENDING]** - Restricted area badge/indicator
- ⏳ **[PENDING]** - Glowing security border effect

**Expected Visual Design:**
- **Color Scheme:** Black, dark gray, gold/amber accents
- **Card Style:** Matte black card with embossed lock icon
- **Background:** Subtle dark gradient with vault door imagery
- **Typography:** Bold, serious font (no playful elements)
- **Icons:** Lock, shield, vault, key
- **Animations:** Unlocking effects, shimmer on hover

---

### 8. Automatic Savings Reports
**Description:** Track and display savings progress with motivational insights

**Status:**
- ⏳ **[PENDING]** - Savings summary widget
- ⏳ **[PENDING]** - "Saved X in last Y months" calculation
- ⏳ **[PENDING]** - Monthly/yearly savings chart
- ⏳ **[PENDING]** - Savings milestones (e.g., "First $100!", "$500 saved!")
- ⏳ **[PENDING]** - Email/push notification reports
- ⏳ **[PENDING]** - Export savings history (PDF/CSV)
- ⏳ **[PENDING]** - Comparison with peers (anonymous)

**Expected Reports:**
```
📊 Savings Report - November 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Saved this month: $240.00
📈 Total savings: $1,420.00
🔥 7-month streak!
🎯 Emergency fund: 78% to goal

🏆 Milestones Unlocked:
  ✓ First $100
  ✓ First $500
  ✓ First $1,000
  ⏳ Next: $2,000 (41% away)
```

---

## Database Schema

### SavingsPocket Model (Existing)
```python
class SavingsPocket(db.Model):
    __tablename__ = 'savings_pockets'
    
    # Core fields
    id = Integer (Primary Key)
    user_id = Integer (Foreign Key to users)
    name = String(100) - "DarkDays Pocket"
    balance = Decimal(10,2) - Current balance
    
    # Auto-save configuration
    auto_save_enabled = Boolean - Auto-save on/off
    auto_save_percentage = Decimal(5,2) - Percentage (e.g., 20%)
    auto_save_frequency = String(20) - "monthly", "weekly", "fixed_date"
    next_auto_save_date = Date - Next scheduled transfer
    
    # Security
    pin_protected = Boolean - Requires PIN
    is_locked = Boolean - Lock status
    
    # Metadata
    created_at = DateTime
    updated_at = DateTime
```

**Status:** ✅ **[IMPLEMENTED]**

### Recommended Additional Fields (Future)
```python
# Add to SavingsPocket model:
emergency_unlock_count = Integer - Track emergency uses
last_emergency_unlock = DateTime - Prevent abuse
withdrawal_cooling_period_hours = Integer - Delay withdrawals
balance_hidden = Boolean - Privacy mode
theme = String(20) - "black_card", "vault", "safe"
total_deposited = Decimal(10,2) - Lifetime deposits
total_withdrawn = Decimal(10,2) - Lifetime withdrawals
```

---

## API Endpoints

### Existing Endpoints

#### GET /api/savings/pockets
Get all savings pockets for current user
- **Status:** ✅ **[IMPLEMENTED]**

#### POST /api/savings/pockets
Create new savings pocket
- **Status:** ✅ **[IMPLEMENTED]**
- **Body:** `{ name, auto_save_percentage, auto_save_frequency }`

#### POST /api/savings/pockets/:id/deposit
Deposit funds to pocket (with PIN)
- **Status:** ✅ **[IMPLEMENTED]**
- **Body:** `{ amount, pin }`

---

### Pending Endpoints

#### POST /api/savings/pockets/:id/withdraw
Withdraw funds from pocket (multi-layer security)
- **Status:** ⏳ **[PENDING]**
- **Body:** `{ amount, pin, password, emergency, reason }`
- **Security:** PIN + password verification required

#### PUT /api/savings/pockets/:id/config
Update auto-save configuration
- **Status:** ⏳ **[PENDING]**
- **Body:** `{ auto_save_enabled, auto_save_percentage, auto_save_frequency, next_auto_save_date }`

#### POST /api/savings/pockets/:id/emergency-unlock
Emergency unlock with verification
- **Status:** ⏳ **[PENDING]**
- **Body:** `{ reason, category, pin, password }`
- **Logs:** Emergency usage for audit

#### GET /api/savings/pockets/:id/reports
Get savings reports and statistics
- **Status:** ⏳ **[PENDING]**
- **Response:** Savings summary, charts, milestones

#### POST /api/savings/pockets/:id/toggle-lock
Lock/unlock pocket
- **Status:** ⏳ **[PENDING]**
- **Body:** `{ is_locked, pin }`

---

## UI Components

### Current Implementation

**Location:** `src/features/savings/pages/SavingsPage.tsx`

**Existing Components:**
- ✅ Pocket creation dialog
- ✅ Pocket list display
- ✅ Balance display
- ✅ Auto-save percentage input
- ✅ Basic card layout

---

### Enhanced UI Components (To Be Created)

#### 1. DarkDaysCard Component
**Purpose:** Black card visualization with vault aesthetics

**Features:**
- Black/dark gray card design
- Lock icon with animation
- Balance display (with blur option)
- Security badge indicator
- No withdrawal button (hidden by default)

**Status:** ⏳ **[PENDING]**

---

#### 2. SecurityVerificationModal Component
**Purpose:** Multi-step verification for withdrawals

**Features:**
- Step 1: PIN entry
- Step 2: Password re-authentication
- Step 3: Emergency confirmation checkbox
- Step 4: Cooling period notification (optional)
- Progress indicator

**Status:** ⏳ **[PENDING]**

---

#### 3. AutoSaveConfigPanel Component
**Purpose:** Configure automatic savings settings

**Features:**
- Enable/disable toggle
- Percentage slider (5% - 50%)
- Frequency dropdown (weekly, monthly, fixed date)
- Date picker for fixed dates
- Preview of next transfer

**Status:** ⏳ **[PENDING]**

---

#### 4. EmergencyUnlockDialog Component
**Purpose:** Emergency access with proper verification

**Features:**
- Emergency category selection
- Reason text field (required)
- Multi-layer verification
- Warning messages
- Email notification opt-in

**Status:** ⏳ **[PENDING]**

---

#### 5. SavingsReportWidget Component
**Purpose:** Display savings progress and reports

**Features:**
- Monthly savings amount
- Total balance trend chart
- Savings streak counter
- Milestone badges
- Export button (PDF/CSV)

**Status:** ⏳ **[PENDING]**

---

#### 6. RestrictedViewToggle Component
**Purpose:** Toggle between view-only and full access modes

**Features:**
- "View Only" mode switch
- Balance blur toggle
- Deposit-only quick action
- Security level indicator

**Status:** ⏳ **[PENDING]**

---

## Implementation Roadmap

### Phase 1: Core Security (Priority: High)
- [ ] Implement withdrawal endpoint with PIN + password
- [ ] Create SecurityVerificationModal component
- [ ] Add emergency unlock functionality
- [ ] Implement cooling period logic
- [ ] Add withdrawal transaction logging

### Phase 2: Automation (Priority: High)
- [ ] Create scheduled job for auto-transfers
- [ ] Implement auto-save trigger on top-up
- [ ] Implement auto-save trigger on incoming transfers
- [ ] Create AutoSaveConfigPanel component
- [ ] Add auto-save transaction history

### Phase 3: Visual Design (Priority: Medium)
- [ ] Design black card component (DarkDaysCard)
- [ ] Implement vault/safe visual theme
- [ ] Add lock/unlock animations
- [ ] Create restricted area section
- [ ] Add balance blur/hide feature

### Phase 4: Reports & Analytics (Priority: Medium)
- [ ] Calculate savings statistics
- [ ] Create SavingsReportWidget component
- [ ] Implement milestone tracking
- [ ] Add savings chart visualization
- [ ] Email report generation

### Phase 5: Advanced Features (Priority: Low)
- [ ] Biometric authentication (future)
- [ ] 2FA integration (future)
- [ ] Peer comparison analytics (future)
- [ ] Savings challenges/gamification (future)

---

## Security Considerations

### Multi-layer Protection
1. **PIN Verification** - 4-6 digit PIN required
2. **Password Re-authentication** - Full password required
3. **Emergency Checkbox** - Must confirm emergency use
4. **Cooling Period** - Optional 24-hour delay
5. **Email Notifications** - Alert on withdrawals
6. **Audit Logging** - Track all access attempts

### Emergency Abuse Prevention
- 7-day cooldown between emergency unlocks
- Maximum 3 emergency unlocks per month
- Email notification on every emergency use
- Flagged transactions for review

### Privacy Features
- Balance blur option
- View-only mode
- Hidden withdrawal buttons
- Separate authentication for viewing full details

---

## User Experience Guidelines

### Positive Reinforcement
- "You've protected $X in Y months!"
- "X days without withdrawal - great discipline!"
- "Emergency fund: Y% to your goal!"

### Friction for Withdrawals (Intentional)
- Multiple verification steps
- Warning messages about breaking savings streak
- Delay timers (cooling period)
- "Are you sure this is an emergency?" prompts

### Ease of Deposits
- One-click auto-save setup
- Quick deposit buttons
- No verification for deposits
- Celebration animations on milestones

---

## Future Enhancements

- [ ] Virtual card issuance for DarkDays Pocket
- [ ] Spending insights (emergency vs non-emergency)
- [ ] Goal-based savings (e.g., "3-month emergency fund")
- [ ] Shared pockets (family emergency fund)
- [ ] Interest earnings on balance
- [ ] Investment options for long-term savings
- [ ] Tax-advantaged savings accounts integration
- [ ] Financial advisor integration
- [ ] Charity donation from savings
- [ ] Round-up savings (spare change automation)

---

## Testing Checklist

### Backend Tests
- [ ] Create pocket with auto-save configuration
- [ ] Verify PIN protection on deposits
- [ ] Verify PIN + password on withdrawals
- [ ] Test emergency unlock flow
- [ ] Test cooling period enforcement
- [ ] Verify auto-save triggers work
- [ ] Test balance calculations
- [ ] Verify transaction logging

### Frontend Tests
- [ ] Pocket creation form validation
- [ ] Security verification modal flow
- [ ] Auto-save configuration UI
- [ ] Emergency unlock dialog
- [ ] Savings report display
- [ ] Responsive design (mobile/desktop)
- [ ] Animation performance
- [ ] Balance blur toggle

---

## Success Metrics

- **Adoption Rate:** % of users who create DarkDays Pocket
- **Savings Rate:** Average monthly savings amount
- **Retention:** Pockets active after 3/6/12 months
- **Emergency Usage:** % of withdrawals marked as emergency
- **Streak Length:** Average days between withdrawals
- **Milestone Completion:** % reaching $500, $1000, $2000 goals

---

## Documentation Status

- ✅ Feature specification complete
- ✅ Database model documented
- ✅ API endpoints mapped
- ✅ UI components outlined
- ✅ Implementation roadmap defined
- ✅ Security considerations detailed
- ⏳ User stories pending
- ⏳ Component wireframes pending
