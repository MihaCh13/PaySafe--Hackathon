# DarkDays Pocket - Manual UI Testing Guide

**Purpose:** Step-by-step instructions to verify all documented DarkDays Pocket features are visually present and functional in the UI.

---

## 🔑 **Test Credentials**

```
Email: test@student.com
Password: password123
Default PIN: 1234
```

---

## 📋 **Pre-Testing Checklist**

- [ ] Both workflows running (backend + frontend)
- [ ] Open browser to the application
- [ ] Clear browser cache if needed
- [ ] Have developer tools open (F12) to check for console errors

---

## ✅ **Phase 1: Navigation & Page Access**

### **Step 1: Login**
1. Navigate to the application URL
2. Log in with test credentials above
3. **Verify:** Successfully redirected to dashboard

### **Step 2: Access DarkDays Pocket Page**

**Desktop:**
- [ ] Look at left sidebar
- [ ] **VERIFY VISIBLE:** "DarkDays Pocket" link with 🛡️ shield icon
- [ ] Click the link
- [ ] **VERIFY:** Navigated to `/darkdays-pocket` URL

**Mobile (if testing responsive):**
- [ ] Look at bottom navigation bar
- [ ] **VERIFY VISIBLE:** Shield icon
- [ ] Tap the icon
- [ ] **VERIFY:** Navigated to DarkDays Pocket page

---

## ✅ **Phase 2: DarkDaysCard Visual Elements**

### **If No Pocket Exists (Empty State):**
- [ ] **VERIFY VISIBLE:** Large 🏦 bank emoji
- [ ] **VERIFY VISIBLE:** Heading: "No DarkDays Pocket Yet"
- [ ] **VERIFY VISIBLE:** Description about emergency fund
- [ ] **VERIFY VISIBLE:** "Create DarkDays Pocket" button (dark gradient)
- [ ] Click "Create DarkDays Pocket"
- [ ] **VERIFY:** Dialog appears with pocket name and auto-save percentage inputs
- [ ] Enter pocket name (or keep default)
- [ ] Enter auto-save percentage (5-50)
- [ ] Click "Create Pocket"
- [ ] **VERIFY:** Toast notification shows success
- [ ] **VERIFY:** Page refreshes and shows the pocket card

---

### **DarkDaysCard Component (After Creation):**

#### **Card Design:**
- [ ] **VERIFY VISIBLE:** Black gradient card (dark aesthetic)
- [ ] **VERIFY VISIBLE:** Gold/amber accents
- [ ] **VERIFY VISIBLE:** Shadow effect around card
- [ ] Hover over card
- [ ] **VERIFY:** Card scales slightly (subtle zoom animation)

#### **Header Section:**
- [ ] **VERIFY VISIBLE:** Lock icon in gold/amber color (top left area)
- [ ] **VERIFY VISIBLE:** Shield icon watermark (top right, transparent)
- [ ] **VERIFY VISIBLE:** Pocket name: "DarkDays Pocket"
- [ ] **VERIFY VISIBLE:** Subtitle: "Secure Emergency Fund"
- [ ] **VERIFY VISIBLE:** "Protected" badge with shield icon (green/amber)

#### **Balance Display:**
- [ ] **VERIFY VISIBLE:** Label: "Secured Balance"
- [ ] **VERIFY VISIBLE:** Large white balance amount (e.g., $0.00, €0.00)
- [ ] **VERIFY VISIBLE:** Eye icon (hide/show balance toggle)
- [ ] Click the eye icon
- [ ] **VERIFY:** Balance blurs out
- [ ] **VERIFY:** Icon changes to crossed-out eye
- [ ] Click again
- [ ] **VERIFY:** Balance visible again

#### **Progress Bar:**
- [ ] **VERIFY VISIBLE:** Horizontal progress bar (gold/amber gradient)
- [ ] **VERIFY VISIBLE:** Text: "75% to goal" (or similar)
- [ ] **VERIFY:** Bar has animated fill effect

#### **Auto-Save Info Panel:**
- [ ] **VERIFY VISIBLE:** Semi-transparent white panel
- [ ] **VERIFY VISIBLE:** Text: "Auto-Save Active"
- [ ] **VERIFY VISIBLE:** Percentage: "X% of income" (based on your setting)
- [ ] **VERIFY VISIBLE:** "Next transfer" label
- [ ] **VERIFY VISIBLE:** Date display (e.g., "Dec 1, 2025")

#### **Action Buttons:**
- [ ] **VERIFY VISIBLE:** Two buttons in grid layout
- [ ] **VERIFY VISIBLE:** Left button: "Deposit" with Plus icon (gold gradient)
- [ ] **VERIFY VISIBLE:** Right button: "Emergency Access" with Lock icon (red outline)

#### **Security Notice:**
- [ ] **VERIFY VISIBLE:** Footer separator line
- [ ] **VERIFY VISIBLE:** Text: "🔒 Multi-layer security active • For emergency use only"

---

## ✅ **Phase 3: Deposit Flow**

### **Step 1: Open Deposit Dialog**
- [ ] Click "Deposit" button on card
- [ ] **VERIFY:** Dialog appears

### **Step 2: Deposit Dialog Visual Elements**
- [ ] **VERIFY VISIBLE:** Title: "Deposit to DarkDays Pocket"
- [ ] **VERIFY VISIBLE:** Amount input with currency symbol ($ or €, etc.)
- [ ] **VERIFY VISIBLE:** Placeholder: "100.00"
- [ ] **VERIFY VISIBLE:** PIN input (password field)
- [ ] **VERIFY VISIBLE:** Placeholder: "••••"
- [ ] **VERIFY VISIBLE:** "Confirm Deposit" button (green gradient)

### **Step 3: Test Deposit**
- [ ] Enter amount: `50`
- [ ] Enter PIN: `1234`
- [ ] **VERIFY:** Button becomes enabled
- [ ] Click "Confirm Deposit"
- [ ] **VERIFY:** Toast notification: "Deposit of $50.00 successful!" (or your currency)
- [ ] **VERIFY:** Dialog closes
- [ ] **VERIFY:** Card balance updates to $50.00
- [ ] **VERIFY:** Toast shows ORIGINAL currency amount, not USD-converted

---

## ✅ **Phase 4: Emergency Withdrawal Flow**

### **Step 1: Emergency Category Selection**
- [ ] Click "Emergency Access" button on card
- [ ] **VERIFY:** EmergencyUnlockDialog appears

### **Emergency Dialog Visual Elements:**
- [ ] **VERIFY VISIBLE:** Title: "Emergency Access Request" with ⚠️ warning icon
- [ ] **VERIFY VISIBLE:** Available balance display
- [ ] **VERIFY VISIBLE:** Red warning alert box
- [ ] **VERIFY VISIBLE:** Warning text about savings discipline

### **Emergency Type Dropdown:**
- [ ] **VERIFY VISIBLE:** Dropdown labeled "Emergency Type *"
- [ ] Click dropdown
- [ ] **VERIFY VISIBLE:** 4 categories with colored icons:
  - [ ] 🫀 Medical Emergency (red)
  - [ ] ✈️ Emergency Travel (blue)
  - [ ] 👥 Family Crisis (purple)
  - [ ] 🔥 Critical Situation (orange)
- [ ] Select "Medical Emergency"
- [ ] **VERIFY:** Icon appears next to dropdown
- [ ] **VERIFY:** Confirmation text: "Medical Emergency selected"

### **Reason Input:**
- [ ] **VERIFY VISIBLE:** Large textarea labeled "Reason for Emergency Access *"
- [ ] **VERIFY VISIBLE:** Placeholder text with guidance
- [ ] **VERIFY VISIBLE:** Character counter: "0/500 characters"
- [ ] **VERIFY VISIBLE:** Audit logging notice
- [ ] Type: `Unexpected medical bills`
- [ ] **VERIFY:** Character counter updates

### **Guidelines Panel:**
- [ ] **VERIFY VISIBLE:** Amber background panel
- [ ] **VERIFY VISIBLE:** "✅ Valid Emergency Examples" section
- [ ] **VERIFY VISIBLE:** List with 4 examples:
  - Medical bills, emergency flights, critical repairs, job loss
- [ ] **VERIFY VISIBLE:** "❌ Not Emergency Examples" section
- [ ] **VERIFY VISIBLE:** List with 4 examples:
  - Shopping, entertainment, gifts, upgrades

### **Additional Info:**
- [ ] **VERIFY VISIBLE:** Blue panel with cooldown notice
- [ ] **VERIFY VISIBLE:** Text about 7-day cooldown period

### **Action Buttons:**
- [ ] **VERIFY VISIBLE:** "Cancel" button (outline)
- [ ] **VERIFY VISIBLE:** "Proceed to Verification" button (red gradient)
- [ ] **VERIFY:** "Proceed" button disabled until both category and reason filled
- [ ] Fill both category and reason
- [ ] **VERIFY:** Button becomes enabled
- [ ] Click "Proceed to Verification"

---

### **Step 2: Withdrawal Amount Input**
- [ ] **VERIFY:** New dialog appears
- [ ] **VERIFY VISIBLE:** Title: "Enter Withdrawal Amount"
- [ ] **VERIFY VISIBLE:** Amount input with currency symbol
- [ ] **VERIFY VISIBLE:** Available balance text below input
- [ ] **VERIFY VISIBLE:** "Continue to Verification" button (red)
- [ ] Enter amount: `20` (must be ≤ your balance)
- [ ] **VERIFY:** Button enabled
- [ ] Try entering amount > balance
- [ ] **VERIFY:** Button becomes disabled
- [ ] Change back to valid amount: `20`
- [ ] Click "Continue to Verification"

---

### **Step 3: Security Verification Modal**

#### **Header:**
- [ ] **VERIFY VISIBLE:** Title: "Emergency Withdrawal Verification" with 🛡️ shield
- [ ] **VERIFY VISIBLE:** Amount display: "Withdrawing $20.00 from DarkDays Pocket"

#### **Progress Bar:**
- [ ] **VERIFY VISIBLE:** "Step 1 of 4" text
- [ ] **VERIFY VISIBLE:** "25%" percentage
- [ ] **VERIFY VISIBLE:** Progress bar (blue/violet, 25% filled)

#### **Step 1: PIN Entry**
- [ ] **VERIFY VISIBLE:** Amber alert box: "Enter your 4-digit security PIN"
- [ ] **VERIFY VISIBLE:** Large centered password input
- [ ] **VERIFY VISIBLE:** Placeholder: "••••"
- [ ] **VERIFY VISIBLE:** Help text below
- [ ] Enter PIN: `1234`
- [ ] **VERIFY:** Input shows as bullets (••••)
- [ ] **VERIFY:** "Next Step" button enabled
- [ ] Click "Next Step"

#### **Step 2: Password**
- [ ] **VERIFY:** Progress bar updates to 50%
- [ ] **VERIFY VISIBLE:** "Step 2 of 4"
- [ ] **VERIFY VISIBLE:** Blue alert box: "Re-enter your account password"
- [ ] **VERIFY VISIBLE:** Password input field
- [ ] **VERIFY VISIBLE:** Help text about UniPay password
- [ ] Enter password: `password123`
- [ ] **VERIFY:** "Next Step" button enabled
- [ ] Click "Next Step"

#### **Step 3: Emergency Confirmation**
- [ ] **VERIFY:** Progress bar updates to 75%
- [ ] **VERIFY VISIBLE:** "Step 3 of 4"
- [ ] **VERIFY VISIBLE:** Red alert box: "This fund is for emergencies only"
- [ ] **VERIFY VISIBLE:** Gray panel with emergency examples:
  - Medical emergencies
  - Unexpected travel costs
  - Family crisis situations
  - Critical repairs
- [ ] **VERIFY VISIBLE:** Checkbox with red border
- [ ] **VERIFY VISIBLE:** Checkbox label: "I confirm this withdrawal is for a genuine emergency"
- [ ] **VERIFY:** "Next Step" button disabled
- [ ] Check the checkbox
- [ ] **VERIFY:** Button becomes enabled
- [ ] Click "Next Step"

#### **Step 4: Cooling Period**
- [ ] **VERIFY:** Progress bar updates to 100%
- [ ] **VERIFY VISIBLE:** "Step 4 of 4"
- [ ] **VERIFY VISIBLE:** Purple panel with ⏰ clock icon
- [ ] **VERIFY VISIBLE:** "24-Hour Cooling Period (Optional)"
- [ ] **VERIFY VISIBLE:** Explanation of immediate vs delayed withdrawal
- [ ] **VERIFY VISIBLE:** Demo mode notice
- [ ] **VERIFY VISIBLE:** "Confirm Withdrawal" button (not "Next Step")
- [ ] Click "Confirm Withdrawal"

#### **Success:**
- [ ] **VERIFY:** All dialogs close
- [ ] **VERIFY:** Toast notification: "Withdrawal of $20.00 successful!" (shows original currency)
- [ ] **VERIFY:** Card balance decreases by $20
- [ ] **VERIFY:** No console errors in developer tools

---

## ✅ **Phase 5: Auto-Save Configuration Panel**

### **Step 1: Navigate to Settings Tab**
- [ ] **VERIFY VISIBLE:** Three tabs at top: Overview, Settings, Reports
- [ ] Click "Settings" tab
- [ ] **VERIFY:** Tab switches

### **Auto-Save Card Header:**
- [ ] **VERIFY VISIBLE:** Card title: "Auto-Save Configuration" with ⚡ icon
- [ ] **VERIFY VISIBLE:** Description: "Automatically transfer a percentage of income to DarkDays Pocket"
- [ ] **VERIFY VISIBLE:** Status badge (green "Active" or gray "Inactive")

### **Enable Toggle:**
- [ ] **VERIFY VISIBLE:** Gray section with switch
- [ ] **VERIFY VISIBLE:** Label: "Enable Auto-Save"
- [ ] **VERIFY VISIBLE:** Help text
- [ ] **VERIFY:** Toggle switch functional (can click on/off)
- [ ] Ensure toggle is ON for next tests

### **Percentage Slider (When Enabled):**
- [ ] **VERIFY VISIBLE:** Large percentage display (2xl font, violet)
- [ ] **VERIFY VISIBLE:** Slider from 5% to 50%
- [ ] **VERIFY VISIBLE:** Labels: "Conservative", "Balanced", "Aggressive"
- [ ] Drag slider
- [ ] **VERIFY:** Percentage number updates in real-time
- [ ] **VERIFY VISIBLE:** Violet preview panel below
- [ ] **VERIFY VISIBLE:** "Estimated monthly savings: $XXX.XX"
- [ ] **VERIFY VISIBLE:** "Based on estimated income" text

### **Frequency Selection:**
- [ ] **VERIFY VISIBLE:** Label: "Transfer Frequency"
- [ ] **VERIFY VISIBLE:** Dropdown
- [ ] Click dropdown
- [ ] **VERIFY VISIBLE:** 3 options with calendar icons:
  - [ ] 📅 Weekly (Every Monday)
  - [ ] 📅 Monthly (1st of month)
  - [ ] 📅 Fixed Date (Choose below)
- [ ] Select "Fixed Date"
- [ ] **VERIFY VISIBLE:** Date picker appears below
- [ ] **VERIFY VISIBLE:** Label: "Fixed Transfer Date"
- [ ] Select a future date
- [ ] **VERIFY:** Date updates

### **Next Transfer Preview:**
- [ ] **VERIFY VISIBLE:** Green background panel
- [ ] **VERIFY VISIBLE:** Left side: "Next Auto-Transfer" + date
- [ ] **VERIFY VISIBLE:** Right side: Amount (large, bold, green)
- [ ] **VERIFY VISIBLE:** "Estimated" label

### **Save Button:**
- [ ] **VERIFY VISIBLE:** Full-width button (violet gradient)
- [ ] **VERIFY VISIBLE:** Text: "Save Configuration"
- [ ] Click "Save Configuration"
- [ ] **VERIFY:** Toast notification: "Auto-save configuration updated successfully!"
- [ ] **VERIFY:** No console errors

### **Disable Toggle Test:**
- [ ] Turn toggle OFF
- [ ] **VERIFY:** All slider/dropdown/preview disappears
- [ ] **VERIFY VISIBLE:** Large gray Zap icon (opacity 30%)
- [ ] **VERIFY VISIBLE:** Text: "Enable auto-save to configure automatic transfers"

---

## ✅ **Phase 6: Info Cards (Overview Tab)**

### **Navigate Back to Overview:**
- [ ] Click "Overview" tab
- [ ] **VERIFY:** Tab switches

### **Info Cards Grid:**
- [ ] **VERIFY VISIBLE:** 3 cards in row (desktop) or stacked (mobile)

#### **Card 1: Multi-Layer Security (Violet)**
- [ ] **VERIFY VISIBLE:** Violet/purple gradient background
- [ ] **VERIFY VISIBLE:** 🔒 emoji
- [ ] **VERIFY VISIBLE:** Title: "Multi-Layer Security"
- [ ] **VERIFY VISIBLE:** Text: "PIN + Password + Emergency confirmation required"

#### **Card 2: Auto-Save Active (Green)**
- [ ] **VERIFY VISIBLE:** Green/emerald gradient background
- [ ] **VERIFY VISIBLE:** ⚡ emoji
- [ ] **VERIFY VISIBLE:** Title: "Auto-Save Active"
- [ ] **VERIFY VISIBLE:** Text: Shows your percentage (e.g., "20% of income automatically saved")

#### **Card 3: Emergency Fund Goal (Amber)**
- [ ] **VERIFY VISIBLE:** Amber/orange gradient background
- [ ] **VERIFY VISIBLE:** 🏆 emoji
- [ ] **VERIFY VISIBLE:** Title: "Emergency Fund Goal"
- [ ] **VERIFY VISIBLE:** Text: "Build 3-6 months of expenses for financial security"

---

## ✅ **Phase 7: Reports Tab**

### **Navigate to Reports:**
- [ ] Click "Reports" tab
- [ ] **VERIFY:** SavingsReportWidget appears
- [ ] **VERIFY VISIBLE:** Savings statistics and charts

---

## ✅ **Phase 8: Multi-Currency Testing**

### **Change Currency:**
1. Navigate to Profile or Settings
2. Change currency to EUR (or another currency)
3. Return to DarkDays Pocket page

### **Verify Currency Display:**
- [ ] **VERIFY:** Card balance shows € symbol (or new currency)
- [ ] **VERIFY:** All amounts use new currency symbol
- [ ] Make a deposit of €25
- [ ] **VERIFY:** Toast shows "Deposit of €25.00 successful!" (NOT USD-converted amount)
- [ ] Make a withdrawal of €10
- [ ] **VERIFY:** Toast shows "Withdrawal of €10.00 successful!" (NOT USD-converted amount)

---

## ✅ **Phase 9: Responsive Design**

### **Desktop View (≥768px):**
- [ ] **VERIFY VISIBLE:** Left sidebar with DarkDays Pocket link
- [ ] **VERIFY VISIBLE:** 2-column grid (Card + Report side by side)
- [ ] **VERIFY VISIBLE:** 3-column grid for info cards

### **Mobile View (<768px):**
- [ ] Resize browser to mobile width OR open on mobile device
- [ ] **VERIFY VISIBLE:** Bottom navigation bar
- [ ] **VERIFY VISIBLE:** Shield icon in bottom nav
- [ ] **VERIFY VISIBLE:** Single column layout
- [ ] **VERIFY:** All dialogs responsive and fit screen
- [ ] **VERIFY:** Buttons are touch-friendly

---

## ✅ **Phase 10: Transaction History**

### **Navigate to Transactions:**
- [ ] Click "Activity" or "Transactions" in sidebar
- [ ] **VERIFY VISIBLE:** Transaction list

### **Find Emergency Withdrawal:**
- [ ] Look for your recent withdrawal transaction
- [ ] **VERIFY VISIBLE:** Transaction shows "Emergency withdrawal from DarkDays Pocket"
- [ ] If available, check transaction details
- [ ] **VERIFY:** Metadata includes emergency category and reason

---

## 📊 **Final Verification Checklist**

### **All Features Visible:**
- [ ] ✅ DarkDaysCard with all elements
- [ ] ✅ Emergency category selection dialog
- [ ] ✅ Emergency reason textarea
- [ ] ✅ Withdrawal amount input dialog
- [ ] ✅ 4-step security verification modal
- [ ] ✅ Auto-save configuration panel
- [ ] ✅ Deposit dialog
- [ ] ✅ Info cards (3 cards)
- [ ] ✅ Navigation link in sidebar
- [ ] ✅ Tab navigation (Overview, Settings, Reports)
- [ ] ✅ Toast notifications
- [ ] ✅ Multi-currency support
- [ ] ✅ Responsive design

### **All Features Functional:**
- [ ] ✅ Can create pocket
- [ ] ✅ Can deposit funds
- [ ] ✅ Can withdraw with emergency flow
- [ ] ✅ Can configure auto-save settings
- [ ] ✅ Toast notifications appear for all actions
- [ ] ✅ Balances update correctly
- [ ] ✅ Currency conversion works (backend USD, UI shows selected currency)

### **No Errors:**
- [ ] ✅ No console errors in developer tools
- [ ] ✅ No broken UI elements
- [ ] ✅ All animations smooth
- [ ] ✅ All text readable and properly formatted

---

## 🎯 **Expected Results**

If all checkboxes are ✅ marked, then:
- **ALL documented features are visually present**
- **ALL features are functional and interactive**
- **User experience is polished and complete**
- **DarkDays Pocket is production-ready**

---

## 📸 **Screenshot Suggestions**

For documentation, capture screenshots of:
1. DarkDaysCard (full card view)
2. Emergency category selection dialog
3. Withdrawal amount input
4. Security verification modal (each step)
5. Auto-save configuration panel
6. Info cards grid
7. Mobile view

---

## ⚠️ **Troubleshooting**

### **Issue: Pocket not appearing after creation**
- Refresh the page
- Check browser console for errors
- Verify backend workflow is running

### **Issue: Toast notifications not showing**
- Check that App.tsx uses Sonner Toaster
- Check browser console for errors
- Try different browser

### **Issue: PIN/Password not working**
- Default PIN: 1234
- Default password: password123
- You can change PIN in Profile page

### **Issue: Balance not updating**
- Check browser console for errors
- Verify backend workflow is running
- Check database connection

---

**Testing Complete!** If all phases pass, the DarkDays Pocket feature is fully implemented and visually accessible. 🎉
