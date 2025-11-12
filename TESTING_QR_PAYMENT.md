# QR Code Payment Feature - Testing Guide

## Overview
The QR Code payment feature allows users to receive payments securely by displaying a time-limited QR code that others can scan.

## Feature Locations

### 1. Transfers Page (`/transfers`)
- **Display QR Code**: Click "Show QR" button in "Receive Money" card
- **Scan QR Code**: Click "Scan QR to Send" button
- Location: `src/features/transfers/pages/TransfersPage.tsx`

### 2. Top Up Page (`/topup`)
- **Display QR Code**: Select "QR Code" payment method OR click "Show My QR Code" button
- **Bank Transfer Details**: Select "Bank Transfer" method and click "View Bank Transfer Details"
- Location: `src/features/topup/pages/TopupPage.tsx`

## Backend Endpoints

### Generate QR Payment Token
```
GET /api/wallet/qr-payment-token
Authorization: Bearer <access_token>

Response:
{
  "token": "signed_token_string",
  "username": "student",
  "user_id": 1,
  "expires_in": 300
}
```

### Verify QR Payment Token
```
POST /api/wallet/verify-qr-token
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "token": "scanned_token_string"
}

Response (Success):
{
  "valid": true,
  "recipient": {
    "user_id": 1,
    "username": "student",
    "full_name": "John Doe"
  }
}

Response (Error):
{
  "error": "QR code has expired. Please generate a new one."
}
```

## Security Features

### Token System
- **Library**: `itsdangerous.URLSafeTimedSerializer` (NOT JWT)
- **Salt**: 'qr-payment-token' (separate from main secret)
- **Expiry**: 5 minutes (300 seconds)
- **Purpose**: 'qr_payment_only' (cannot be used for API auth)

### Validation Checks
1. **Signature verification**: Prevents token tampering
2. **Expiry check**: Tokens expire after 5 minutes
3. **Recipient existence**: Verifies user still exists
4. **Active status**: Checks if recipient account is active
5. **Self-transfer prevention**: Cannot send money to yourself
6. **Purpose validation**: Only payment verification tokens accepted

### Key Security Principle
❌ **Does NOT** use JWT access tokens (would grant API access)
✅ **Uses** separate signed tokens that ONLY work for payment verification

## Testing Steps

### Test 1: Generate and Display QR Code
1. Login as User A (e.g., student@test.com / password123)
2. Navigate to `/topup` or `/transfers`
3. Click "Show QR Code" or select "QR Code" method
4. **Expected**: QR code displays with:
   - 200x200px QR code
   - Username (@student)
   - "Expires in 5 minutes" warning
   - Refresh button
   - Bank Details button (in Top Up)

### Test 2: Scan QR Code (Manual Simulation)
1. Login as User B in a different browser/session
2. Navigate to `/transfers`
3. Click "Scan QR to Send"
4. **Manual Test**: Copy the token from User A's QR dialog
5. Paste into scanner (or use camera if available)
6. **Expected**:
   - Scanner validates token via backend
   - Recipient username auto-fills in send form
   - Success toast: "Recipient set to @student"
   - Transfer dialog opens

### Test 3: Token Expiry
1. Generate QR code
2. Wait 5+ minutes
3. Try to scan/verify the QR code
4. **Expected**: Error "QR code has expired"

### Test 4: Self-Transfer Prevention
1. Login as User A
2. Generate QR code for User A
3. Try to scan own QR code
4. **Expected**: Error "Cannot send money to yourself"

### Test 5: Invalid Token
1. Modify the QR token string manually
2. Try to verify the modified token
3. **Expected**: Error "Invalid QR code signature"

### Test 6: Bank Transfer Details
1. Navigate to `/topup`
2. Select "Bank Transfer" method
3. Click "View Bank Transfer Details"
4. **Expected**: Dialog shows:
   - Account Name: UniPay Student Account
   - Account Number: 1234567890
   - Routing Number: 021000021
   - SWIFT Code: UNIPAYXX
   - Bank Name: UniPay Digital Bank
   - Payment Reference: @<username>
5. Click copy button on any field
6. **Expected**: Toast "Field copied to clipboard"

### Test 7: End-to-End Payment Flow
1. User A generates QR code
2. User B scans QR code
3. Recipient auto-fills as User A
4. User B enters amount ($50)
5. User B clicks "Send Money"
6. **Expected**:
   - Transfer succeeds
   - Both wallets update
   - Both users see transaction in history
   - Toast confirmations appear

## Files Updated

### Frontend
- `src/features/transfers/pages/TransfersPage.tsx` - QR display & scanner
- `src/features/topup/pages/TopupPage.tsx` - QR display & bank details
- `src/lib/api.ts` - API methods for QR endpoints

### Backend
- `backend/app/blueprints/wallet.py` - QR generation & verification endpoints

### Documentation
- `replit.md` - Feature specification updated

## Common Issues & Solutions

### Issue: QR Scanner not working
**Solution**: Ensure browser has camera permissions. On mobile, use HTTPS.

### Issue: "Invalid QR code" error
**Solution**: QR may have expired. Refresh the code and try again.

### Issue: Token reuse for API auth
**Solution**: NOT POSSIBLE - tokens use separate signing mechanism and cannot be used as bearer tokens

### Issue: Copy to clipboard fails
**Solution**: Requires HTTPS or localhost. Check browser permissions.

## API Integration Example

```javascript
// Generate QR token
const response = await walletAPI.generateQRToken();
const token = response.data.token;

// Display QR code
<QRCodeSVG value={token} size={200} level="H" />

// Verify scanned token
const verification = await walletAPI.verifyQRToken(scannedToken);
if (verification.data.valid) {
  const recipient = verification.data.recipient;
  // Auto-fill transfer form
  setRecipientUsername(recipient.username);
}
```

## Security Best Practices

1. ✅ Always validate tokens on backend before trusting data
2. ✅ Use separate token signing mechanism (not JWT)
3. ✅ Enforce short expiry times (5 minutes max)
4. ✅ Validate recipient exists and is active
5. ✅ Prevent self-transfers
6. ✅ Show expiry warnings to users
7. ✅ Allow token refresh without re-login

