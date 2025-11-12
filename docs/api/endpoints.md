# UniPay API Documentation

## Base URL
- **Development**: `http://localhost:8000/api`
- **Production**: `https://unipay.com/api`

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message",
  "status": "success"
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": "error"
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "username": "johndoe",
  "password": "securePassword123",
  "pin": "1234"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "student@university.edu",
    "username": "johndoe"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Status Codes:**
- `201`: User created successfully
- `400`: Validation error
- `409`: Email or username already exists

---

### Login
**POST** `/auth/login`

Authenticate a user and get JWT token.

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "student@university.edu",
    "username": "johndoe"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Status Codes:**
- `200`: Login successful
- `401`: Invalid credentials

---

### Get Current User
**GET** `/auth/me`

Get currently authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "student@university.edu",
  "username": "johndoe",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

## Wallet Endpoints

### Get Wallet
**GET** `/wallet`

Get user's wallet balance and information.

**Headers:** Authorization required

**Response:**
```json
{
  "balance": 150.50,
  "username": "johndoe",
  "user_id": 1
}
```

---

### Top-up Wallet
**POST** `/wallet/topup`

Add funds to wallet.

**Request Body:**
```json
{
  "amount": 100.00,
  "method": "card"
}
```

**Response:**
```json
{
  "balance": 250.50,
  "message": "Top-up successful"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid amount

---

### Transfer Money
**POST** `/wallet/transfer`

Send money to another user.

**Request Body:**
```json
{
  "receiver_username": "janedoe",
  "amount": 50.00,
  "description": "Lunch money"
}
```

**Response:**
```json
{
  "message": "Transfer successful",
  "new_balance": 200.50
}
```

**Status Codes:**
- `200`: Success
- `400`: Insufficient balance
- `404`: Receiver not found

---

## Cards Endpoints

### List Cards
**GET** `/cards`

Get all virtual cards for the user.

**Response:**
```json
{
  "cards": [
    {
      "id": 1,
      "card_name": "Shopping Card",
      "card_number": "4532********1234",
      "expiry_date": "12/26",
      "cvv": "***",
      "card_type": "standard",
      "is_frozen": false,
      "spending_limit": 500.00
    }
  ]
}
```

---

### Create Card
**POST** `/cards`

Create a new virtual card.

**Request Body:**
```json
{
  "card_name": "Travel Card",
  "card_type": "premium",
  "spending_limit": 1000.00
}
```

**Response:**
```json
{
  "card": {
    "id": 2,
    "card_name": "Travel Card",
    "card_number": "4532********5678",
    "expiry_date": "12/26",
    "cvv": "123",
    "card_type": "premium",
    "is_frozen": false,
    "spending_limit": 1000.00
  }
}
```

---

### Freeze Card
**POST** `/cards/<id>/freeze`

Freeze a virtual card.

**Response:**
```json
{
  "message": "Card frozen successfully"
}
```

---

### Unfreeze Card
**POST** `/cards/<id>/unfreeze`

Unfreeze a virtual card.

**Response:**
```json
{
  "message": "Card unfrozen successfully"
}
```

---

## Transactions Endpoints

### List Transactions
**GET** `/transactions`

Get transaction history with pagination.

**Query Parameters:**
- `page` (int, default: 1)
- `per_page` (int, default: 20)
- `type` (string, optional): Filter by type

**Response:**
```json
{
  "transactions": [
    {
      "id": 1,
      "type": "transfer_received",
      "amount": 50.00,
      "description": "Transfer from @johndoe",
      "status": "completed",
      "created_at": "2025-01-01T12:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "per_page": 20
}
```

---

### Get Transaction Stats
**GET** `/transactions/stats`

Get transaction statistics.

**Response:**
```json
{
  "total_income": 500.00,
  "total_expenses": 200.00,
  "current_balance": 300.00,
  "transaction_count": 25
}
```

---

## Savings Endpoints

### Get DarkDays Pocket
**GET** `/savings/pocket`

Get savings pocket information.

**Response:**
```json
{
  "balance": 150.00,
  "auto_save_percentage": 10
}
```

---

### Deposit to Pocket
**POST** `/savings/pocket/deposit`

Add funds to savings pocket.

**Request Body:**
```json
{
  "amount": 50.00
}
```

---

### Withdraw from Pocket
**POST** `/savings/pocket/withdraw`

Withdraw from savings pocket (requires PIN).

**Request Body:**
```json
{
  "amount": 30.00,
  "pin": "1234"
}
```

---

### List Goals
**GET** `/savings/goals`

Get all savings goals.

**Response:**
```json
{
  "goals": [
    {
      "id": 1,
      "name": "New Laptop",
      "description": "MacBook Pro",
      "target_amount": 2000.00,
      "current_amount": 500.00,
      "is_completed": false
    }
  ]
}
```

---

### Create Goal
**POST** `/savings/goals`

Create a new savings goal.

**Request Body:**
```json
{
  "name": "Vacation",
  "description": "Summer trip",
  "target_amount": 1500.00
}
```

---

### Contribute to Goal
**POST** `/savings/goals/<id>/contribute`

Add funds to a goal.

**Request Body:**
```json
{
  "amount": 100.00
}
```

---

## Marketplace Endpoints

### List Listings
**GET** `/marketplace/listings`

Get all active marketplace listings.

**Response:**
```json
{
  "listings": [
    {
      "id": 1,
      "title": "Calculus Textbook",
      "description": "Like new condition",
      "category": "books",
      "price": 45.00,
      "seller_username": "johndoe",
      "status": "active"
    }
  ]
}
```

---

### Create Listing
**POST** `/marketplace/listings`

Create a new listing.

**Request Body:**
```json
{
  "title": "Python Programming Book",
  "description": "Excellent condition",
  "category": "books",
  "price": 35.00
}
```

---

### Create Order
**POST** `/marketplace/orders`

Purchase a listing (escrow payment).

**Request Body:**
```json
{
  "listing_id": 1
}
```

---

## Loans Endpoints

### List Loans
**GET** `/loans`

Get all loans (given and received).

**Response:**
```json
{
  "given_loans": [
    {
      "id": 1,
      "borrower_username": "janedoe",
      "amount": 100.00,
      "amount_repaid": 50.00,
      "description": "Emergency loan",
      "status": "active"
    }
  ],
  "received_loans": []
}
```

---

### Create Loan
**POST** `/loans`

Create a new loan.

**Request Body:**
```json
{
  "borrower_username": "janedoe",
  "amount": 100.00,
  "description": "Textbook loan"
}
```

---

### Repay Loan
**POST** `/loans/<id>/repay`

Make a loan repayment.

**Request Body:**
```json
{
  "amount": 50.00
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

## Rate Limiting (Planned)
- 100 requests per minute per user
- 1000 requests per hour per user
