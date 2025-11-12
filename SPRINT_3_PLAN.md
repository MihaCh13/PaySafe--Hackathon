# Sprint 3: Payment Integration & Test Coverage

## Overview
**Goal:** Achieve full production readiness with payment gateway integration and comprehensive test coverage.

**Duration:** 5-7 days  
**Priority:** High (blocks production launch)

---

## C-5: Payment Gateway Integration (Stripe)

### Status
⚠️ **Partially Complete** → Target: ✅ **Fully Integrated**

**Current State:**
- ✅ QR code payment system (manual flow)
- ❌ No live payment processing

### Deliverables

#### 1. Stripe Integration Setup (Day 1)
**Files to Create/Modify:**
- `backend/app/blueprints/payments.py` (NEW)
- `backend/app/__init__.py` (register blueprint)
- `src/pages/TopUp.tsx` (add Stripe checkout)
- `src/components/StripeCheckout.tsx` (NEW)

**Tasks:**
- [ ] Use Replit Stripe integration (`blueprint:flask_stripe`)
- [ ] Request `STRIPE_SECRET_KEY` from user
- [ ] Install `stripe` Python package
- [ ] Create payments blueprint with Stripe API integration

**Code Structure:**
```python
# backend/app/blueprints/payments.py
import stripe
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

payments_bp = Blueprint('payments', __name__)
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

@payments_bp.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    """Create Stripe checkout session for top-up"""
    # Validate amount, create session, return URL
```

#### 2. Top-Up Flow Integration (Day 2)
**Features:**
- [ ] Stripe checkout session creation endpoint
- [ ] Success/cancel webhooks for payment confirmation
- [ ] Automatic wallet top-up on successful payment
- [ ] Transaction record creation with payment metadata
- [ ] Frontend Stripe checkout redirect

**Endpoints:**
- `POST /api/payments/create-checkout-session` - Create Stripe session
- `POST /api/payments/webhook` - Handle Stripe webhooks
- `GET /api/payments/verify/{session_id}` - Verify payment status

#### 3. Frontend Integration (Day 2-3)
**Files:**
- `src/pages/TopUp.tsx` - Add Stripe option
- `src/components/StripeCheckout.tsx` - Stripe UI component
- `src/lib/stripe.ts` - Stripe helpers

**UI Flow:**
1. User selects amount to top up
2. Click "Pay with Stripe" button
3. Redirect to Stripe checkout page
4. Return to success/cancel page
5. Wallet balance updated automatically

#### 4. Testing & Validation (Day 3)
**Test Cases:**
- [ ] Successful payment flow (test mode)
- [ ] Failed payment handling
- [ ] Webhook signature validation
- [ ] Duplicate payment prevention
- [ ] Amount validation (min/max limits)
- [ ] Transaction record creation
- [ ] Wallet balance update accuracy

**Test Credentials:**
- Stripe test API keys
- Test card: 4242 4242 4242 4242

#### 5. Security Hardening (Day 4)
**Requirements:**
- [ ] Webhook signature verification (prevent spoofing)
- [ ] Idempotency keys (prevent duplicate charges)
- [ ] Amount limits (min $5, max $10,000 per transaction)
- [ ] Rate limiting on checkout session creation
- [ ] Audit logging for all payment events

### Alternative: PayPal Integration
**If Stripe is not preferred:**
- Use `blueprint:javascript_paypal` integration
- Similar timeline (4-5 days)
- PayPal Web SDK integration
- Checkout button in TopUp page

### Timeline: C-5
- **Day 1:** Stripe setup, backend integration
- **Day 2:** Top-up flow, webhook handling
- **Day 3:** Frontend integration, UI components
- **Day 4:** Security hardening, validation
- **Day 5:** Testing, documentation

**Total:** 5 days

---

## C-10: Test Coverage Implementation

### Status
❌ **Not Started** → Target: ✅ **Minimum 70% Coverage**

### Test Strategy

#### Minimum Acceptable Coverage (MVP)
**Critical Flows (Must Have):**
- Authentication (login, register, JWT)
- Wallet operations (balance, transfer, top-up)
- Virtual cards (create, spend, freeze)
- Marketplace (listing, ordering, escrow)
- P2P Lending (request, approve, repay)

**Target Coverage:**
- Overall: 70%+
- Critical endpoints: 90%+
- Models: 80%+

### Deliverables

#### 1. Test Infrastructure Setup (Day 1)
**Files to Create:**
- `backend/tests/conftest.py` (pytest fixtures)
- `backend/tests/__init__.py`
- `backend/pytest.ini` (configuration)
- `.env.test` (test environment variables)

**Tasks:**
- [ ] Install testing packages: `pytest`, `pytest-flask`, `pytest-cov`, `factory-boy`
- [ ] Configure test database (separate from dev)
- [ ] Create base fixtures (app, client, test users)
- [ ] Set up coverage reporting

**Configuration:**
```ini
# pytest.ini
[pytest]
testpaths = backend/tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --cov=backend/app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=70
```

#### 2. Model Unit Tests (Day 1-2)
**Files:**
- `backend/tests/test_models/test_user.py`
- `backend/tests/test_models/test_wallet.py`
- `backend/tests/test_models/test_virtual_card.py`
- `backend/tests/test_models/test_loan.py`
- `backend/tests/test_models/test_marketplace.py`

**Test Coverage:**
```python
# Example: test_virtual_card.py
def test_virtual_card_can_spend_within_budget():
    """Test budget limit enforcement"""
    card = VirtualCard(allocated_budget=100, amount_spent=50)
    can_spend, msg = card.can_spend(40)
    assert can_spend == True

def test_virtual_card_exceeds_budget():
    """Test budget limit rejection"""
    card = VirtualCard(allocated_budget=100, amount_spent=90)
    can_spend, msg = card.can_spend(20)
    assert can_spend == False
    assert "Exceeds allocated budget" in msg
```

**Models to Test:**
- User (registration, authentication)
- Wallet (balance operations)
- VirtualCard (budget validation)
- Loan (lifecycle, repayment)
- Marketplace (listing, order status)
- Transaction (creation, validation)

#### 3. API Integration Tests (Day 2-3)
**Files:**
- `backend/tests/test_api/test_auth.py`
- `backend/tests/test_api/test_wallet.py`
- `backend/tests/test_api/test_virtual_cards.py`
- `backend/tests/test_api/test_marketplace.py`
- `backend/tests/test_api/test_loans.py`

**Critical Test Cases:**

**Authentication (test_auth.py):**
```python
def test_register_success(client):
    """Test successful user registration"""
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'SecurePass123!',
        'university': 'Test University'
    })
    assert response.status_code == 201
    assert 'access_token' in response.json

def test_login_rate_limiting(client):
    """Test rate limiting on login endpoint"""
    # Make 6 requests (limit is 5/min)
    for i in range(6):
        response = client.post('/api/auth/login', json={
            'identifier': 'user@test.com',
            'password': 'wrong'
        })
    assert response.status_code == 429  # Too many requests
```

**Wallet Operations (test_wallet.py):**
```python
def test_transfer_success(auth_client, test_users):
    """Test successful peer-to-peer transfer"""
    response = auth_client.post('/api/wallet/transfer', json={
        'receiver_identifier': 'user2@test.com',
        'amount': 50.00,
        'description': 'Test transfer'
    })
    assert response.status_code == 200
    assert response.json['message'] == 'Transfer successful'

def test_transfer_insufficient_balance(auth_client):
    """Test transfer rejection with insufficient balance"""
    response = auth_client.post('/api/wallet/transfer', json={
        'receiver_identifier': 'user2@test.com',
        'amount': 99999.00
    })
    assert response.status_code == 400
    assert 'Insufficient balance' in response.json['error']

def test_transfer_deadlock_prevention(client, test_users):
    """Test concurrent transfers don't deadlock"""
    # Simulate concurrent transfers between two users
    # Both should complete without deadlock
```

**Budget Cards (test_virtual_cards.py):**
```python
def test_create_budget_card(auth_client):
    """Test budget card creation"""
    response = auth_client.post('/api/virtual-cards', json={
        'card_name': 'Netflix Card',
        'allocated_budget': 15.00,
        'monthly_spending_limit': 15.00,
        'card_purpose': 'subscription'
    })
    assert response.status_code == 201

def test_budget_card_prevents_overspending(auth_client, budget_card):
    """Test budget card rejects overspending"""
    # Try to spend more than budget
    response = auth_client.post(f'/api/virtual-cards/{budget_card.id}/spend', json={
        'amount': 999.00
    })
    assert response.status_code == 400
    assert 'Exceeds' in response.json['error']
```

**Marketplace (test_marketplace.py):**
```python
def test_create_listing(auth_client):
    """Test marketplace listing creation"""
    response = auth_client.post('/api/marketplace/listings', json={
        'title': 'Used Textbook',
        'description': 'Math textbook',
        'price': 25.00,
        'category': 'books'
    })
    assert response.status_code == 201

def test_order_with_escrow(auth_client, test_listing):
    """Test order placement with escrow locking"""
    response = auth_client.post(f'/api/marketplace/listings/{test_listing.id}/order')
    assert response.status_code == 200
    assert response.json['order']['escrow_released'] == True
```

**P2P Lending (test_loans.py):**
```python
def test_loan_request_creation(auth_client):
    """Test loan request creation"""
    response = auth_client.post('/api/loans', json={
        'lender_identifier': 'lender@test.com',
        'amount': 100.00,
        'description': 'Emergency loan',
        'due_date': '2025-12-31'
    })
    assert response.status_code == 201

def test_loan_repayment_insufficient_balance(auth_client, active_loan):
    """Test repayment rejection with insufficient balance"""
    response = auth_client.post(f'/api/loans/{active_loan.id}/repay', json={
        'amount': 99999.00
    })
    assert response.status_code == 400
    assert 'Insufficient' in response.json['error']
```

#### 4. End-to-End Tests (Day 4)
**Files:**
- `backend/tests/test_e2e/test_user_flows.py`

**Complete User Journeys:**
```python
def test_complete_marketplace_flow(client):
    """Test complete marketplace flow from registration to purchase"""
    # 1. Register seller
    seller = register_user(client, 'seller@test.com')
    
    # 2. Create listing
    listing = create_listing(seller, 'Laptop', 500.00)
    
    # 3. Register buyer
    buyer = register_user(client, 'buyer@test.com')
    
    # 4. Top up buyer wallet
    topup_wallet(buyer, 600.00)
    
    # 5. Place order
    order = place_order(buyer, listing.id)
    
    # 6. Verify balances
    assert get_wallet_balance(buyer) == 100.00  # 600 - 500
    assert get_wallet_balance(seller) == 500.00

def test_complete_loan_lifecycle(client):
    """Test loan request, approval, repayment flow"""
    # 1. Borrower requests loan
    # 2. Lender approves loan
    # 3. Borrower repays loan
    # 4. Verify final balances
```

#### 5. Validation & Security Tests (Day 4-5)
**Files:**
- `backend/tests/test_security/test_validation.py`
- `backend/tests/test_security/test_rate_limiting.py`

**Security Test Cases:**
```python
def test_xss_prevention(client):
    """Test HTML sanitization prevents XSS"""
    response = client.post('/api/marketplace/listings', json={
        'title': '<script>alert("XSS")</script>',
        'description': 'Normal text'
    })
    listing = response.json['listing']
    assert '<script>' not in listing['title']

def test_sql_injection_prevention(client):
    """Test SQLAlchemy ORM prevents SQL injection"""
    response = client.post('/api/auth/login', json={
        'identifier': "admin' OR '1'='1",
        'password': 'anything'
    })
    assert response.status_code == 401  # Not 200

def test_file_upload_size_limit(client):
    """Test image upload rejects oversized files"""
    large_image = 'data:image/png;base64,' + ('A' * 10_000_000)  # 10MB
    response = client.post('/api/marketplace/listings', json={
        'title': 'Test',
        'image': large_image
    })
    assert response.status_code == 400
    assert 'exceeds' in response.json['error'].lower()
```

#### 6. Regression Test Suite (Day 5)
**Purpose:** Verify all Sprint 1 & 2 fixes still work

**Test Coverage:**
- Rate limiting still active
- Input validation still enforced
- Budget card limits still enforced
- Deadlock prevention still working
- Database indexes still present
- Balance validation still checking

#### 7. Test Documentation & CI Setup (Day 5)
**Files:**
- `backend/tests/README.md` (test documentation)
- `.github/workflows/tests.yml` (CI pipeline - optional)

**Documentation:**
- How to run tests
- How to add new tests
- Coverage requirements
- Test data setup

**Commands:**
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend/app --cov-report=html

# Run specific test file
pytest backend/tests/test_api/test_auth.py

# Run tests matching pattern
pytest -k "test_transfer"
```

### Timeline: C-10
- **Day 1:** Test infrastructure, model tests (User, Wallet)
- **Day 2:** Model tests (Cards, Loans), API tests (Auth, Wallet)
- **Day 3:** API tests (Marketplace, Loans, Cards)
- **Day 4:** E2E tests, security tests
- **Day 5:** Regression tests, documentation, CI setup

**Total:** 5 days

### Minimum Coverage Targets
| Component | Target Coverage | Critical? |
|-----------|----------------|-----------|
| Authentication | 90%+ | ✅ Yes |
| Wallet Operations | 90%+ | ✅ Yes |
| Virtual Cards | 85%+ | ✅ Yes |
| Marketplace | 85%+ | ✅ Yes |
| P2P Lending | 85%+ | ✅ Yes |
| Models | 80%+ | ✅ Yes |
| Utilities (validators) | 95%+ | ✅ Yes |
| Overall Project | 70%+ | ✅ Yes |

---

## Sprint 3 Task List

### Week 1: Parallel Development
**Days 1-2:** Payment Integration Setup + Test Infrastructure
**Days 3-4:** Payment Flow + API Tests
**Day 5:** Payment Testing + E2E Tests

### Week 2: Finalization
**Day 6:** Security hardening (both)
**Day 7:** Regression testing, documentation

### Total Timeline: 7 days

---

## Regression Testing Plan

### Before Sprint 3
✅ **Baseline established** - All Sprint 1 & 2 features working

### During Sprint 3
After each major change, verify:
- [ ] Login still works
- [ ] Transfers still work
- [ ] Budget cards still enforce limits
- [ ] Marketplace orders still complete
- [ ] Loans still process correctly

### After Sprint 3
**Full Regression Suite:**
1. **Authentication Flow**
   - Register new user
   - Login with credentials
   - JWT token validation
   - Rate limiting active

2. **Wallet Operations**
   - View balance
   - Transfer to another user
   - Receive transfer
   - View transaction history

3. **Virtual Cards**
   - Create budget card
   - Attempt to overspend (should fail)
   - Freeze/unfreeze card
   - Link to subscription

4. **Marketplace**
   - Create listing
   - Browse listings
   - Place order
   - Verify escrow/balance changes

5. **P2P Lending**
   - Request loan
   - Approve loan
   - Attempt repayment with insufficient balance (should fail)
   - Successful repayment

6. **Performance**
   - Verify database queries use indexes
   - Check response times (<500ms for simple queries)

### Automated Regression Tests
All regression checks will be added to the test suite for continuous verification.

---

## Definition of Done

### C-5: Payment Gateway Integration
- [x] Stripe integration configured
- [ ] Checkout session creation endpoint
- [ ] Webhook handling for payment confirmation
- [ ] Frontend Stripe checkout flow
- [ ] Success/cancel page handling
- [ ] Transaction record creation
- [ ] Wallet balance auto-update
- [ ] Security: webhook signature verification
- [ ] Security: idempotency keys
- [ ] Security: amount limits
- [ ] Test mode validation (successful payment)
- [ ] Test mode validation (failed payment)
- [ ] Documentation updated
- [ ] Architect review completed

### C-10: Test Coverage
- [ ] Test infrastructure setup
- [ ] Model unit tests (6+ files)
- [ ] API integration tests (5+ files)
- [ ] E2E user flow tests
- [ ] Security/validation tests
- [ ] Regression test suite
- [ ] Coverage ≥70% overall
- [ ] Coverage ≥90% for critical endpoints
- [ ] CI pipeline configured (optional)
- [ ] Test documentation
- [ ] All tests passing
- [ ] Architect review completed

---

## Success Metrics

**Payment Integration:**
- ✅ Live payments processing successfully
- ✅ Zero failed payments due to integration errors
- ✅ Wallet balances update within 30 seconds
- ✅ 100% webhook delivery rate

**Test Coverage:**
- ✅ 70%+ overall coverage achieved
- ✅ 90%+ coverage on critical flows
- ✅ Zero regression failures
- ✅ All tests execute in <60 seconds

---

## Risk Mitigation

### Payment Integration Risks
**Risk:** Stripe API changes  
**Mitigation:** Use official Stripe Python SDK (stable)

**Risk:** Webhook failures  
**Mitigation:** Implement retry logic, fallback polling

**Risk:** Double-charging  
**Mitigation:** Idempotency keys, transaction deduplication

### Testing Risks
**Risk:** Low coverage  
**Mitigation:** Prioritize critical flows first, iterate

**Risk:** Flaky tests  
**Mitigation:** Use database rollback, isolated test data

**Risk:** Test maintenance burden  
**Mitigation:** Use factories (factory-boy), reusable fixtures

---

## Post-Sprint 3 Status

**Expected State:**
- ✅ 12/12 critical issues resolved
- ✅ Payment gateway live (Stripe)
- ✅ Test coverage ≥70%
- ✅ All regression tests passing
- ✅ Production-ready application

**Security Score:** A+ (95/100)

**Next Steps:** Production deployment 🚀
