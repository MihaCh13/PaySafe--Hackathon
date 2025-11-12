# Student Marketplace (Like OLX)

## Overview
The Student Marketplace is a peer-to-peer trading platform designed specifically for students to buy and sell academic materials, course projects, lecture notes, and other educational resources within their university community. It features advanced filtering, escrow payment protection, and automatic listing management.

## Core Functionalities

### 1. Market Section Inside App ✅ DONE
**Purpose**: Dedicated marketplace section accessible from main navigation

**Features**:
- Main marketplace page with grid/list view
- Search bar for quick item lookup
- Category-based browsing
- Active listings counter
- Quick create listing button

**Status**: ✅ **IMPLEMENTED**
- MarketplacePage component created
- Accessible via sidebar navigation with Store icon
- Revolut-inspired modern UI design

---

### 2. Advanced Filtering System 🚧 PARTIAL
**Purpose**: Filter listings by multiple academic criteria

**Filter Categories**:
- **Content Type**: Course project, Lecture notes, Lab protocols, Assignments, Thesis
- **Academic Level**: Undergraduate, Graduate, PhD
- **Discipline**: Engineering, Science, Business, Arts, Medical, Law, etc.
- **University**: Filter by specific institution
- **Specialty/Major**: Computer Science, Biology, Economics, etc.
- **Course**: Specific course codes or names
- **Faculty/Department**: Engineering Faculty, Business School, etc.
- **Price Range**: Min/max price slider
- **Condition**: New, Like New, Good, Fair (for physical items)
- **Availability**: Available, Sold, Reserved

**Status**: 🚧 **PARTIAL**
- ✅ Basic category filtering implemented (books, notes, electronics, furniture, other)
- ✅ University filtering in backend
- 📋 **PENDING**: Academic-specific categories (course project, lecture notes, protocols, etc.)
- 📋 **PENDING**: Advanced multi-filter UI component
- 📋 **PENDING**: Discipline, specialty, course, faculty filters
- 📋 **PENDING**: Price range slider
- 📋 **PENDING**: Condition and availability filters

---

### 3. Create and Publish Listings ✅ DONE
**Purpose**: Allow students to create detailed academic material listings

**Listing Fields**:
- **Basic Info**:
  - Title (required)
  - Description (required)
  - Price (required)
  - Category (required)
  
- **Academic Info**:
  - University
  - Faculty/Department
  - Course name/code
  - Academic year/semester
  - Subject/discipline
  
- **Item Details**:
  - Condition (for physical items)
  - File format (for digital items)
  - Page count/size
  - Language
  
- **Media**:
  - Upload images/preview
  - File attachments (for digital items)
  
- **Options**:
  - One-time offer (auto-remove after sale)
  - Digital delivery
  - Physical delivery options

**Status**: ✅ **IMPLEMENTED**
- ✅ Create listing dialog with form
- ✅ Basic fields (title, description, category, price)
- ✅ Backend endpoint for creating listings
- 📋 **PENDING**: Extended academic fields in form
- 📋 **PENDING**: File upload functionality
- 📋 **PENDING**: Image upload
- 📋 **PENDING**: One-time offer toggle

---

### 4. Seller Profile Display ✅ DONE
**Purpose**: Show seller information for transparency and trust

**Profile Information Displayed**:
- Seller name
- University
- Faculty/Department
- Course/Year
- Member since date
- Rating/reviews (future enhancement)
- Response time (future enhancement)
- Successful sales count

**Status**: ✅ **IMPLEMENTED**
- ✅ Backend models include seller relationship
- ✅ User model has university and faculty fields
- 📋 **PENDING**: Seller profile card component in listing view
- 📋 **PENDING**: Rating system integration
- 📋 **PENDING**: Seller statistics display

---

### 5. Escrow Payment System 🚧 PARTIAL
**Purpose**: Protect both buyers and sellers during transactions

**Escrow Flow**:
1. **Buyer Initiates Purchase**: Funds deducted from wallet
2. **Funds Held in Escrow**: Money locked until delivery
3. **Seller Uploads File**: For digital items
4. **Buyer Confirms Receipt**: Validates delivery
5. **Funds Released to Seller**: After confirmation or auto-release timer
6. **Dispute Resolution**: If issues arise (future enhancement)

**Backend Fields**:
- Order status: pending, in_escrow, completed, cancelled, disputed
- Escrow amount
- Escrow release flag
- File upload proof
- Delivery confirmation timestamp

**Status**: 🚧 **PARTIAL**
- ✅ MarketplaceOrder model with escrow fields
- ✅ Create order endpoint
- ✅ Escrow status tracking
- 📋 **PENDING**: Wallet integration for fund locking
- 📋 **PENDING**: File upload endpoint for sellers
- 📋 **PENDING**: Buyer confirmation mechanism
- 📋 **PENDING**: Auto-release timer (7 days default)
- 📋 **PENDING**: Refund/dispute flow
- 📋 **PENDING**: Escrow status UI indicators

---

### 6. Auto-Remove Listing (One-Time Offer) 📋 PENDING
**Purpose**: Automatically remove listings after successful sale for one-time items

**Features**:
- Toggle "One-time offer" when creating listing
- Automatic status change to unavailable after first purchase
- Listing hidden from marketplace after sale
- Seller notification of sale and removal
- Option to re-list similar item

**Implementation**:
- Database field: `is_one_time_offer` (boolean)
- Trigger on order creation: Check if one-time, mark as sold
- Cron job or event listener: Remove from active listings
- Email/notification to seller

**Status**: 📋 **PENDING**
- 📋 **PENDING**: Add is_one_time_offer field to model
- 📋 **PENDING**: Checkbox in create listing form
- 📋 **PENDING**: Auto-removal logic on order completion
- 📋 **PENDING**: Seller notification system

---

### 7. Additional Marketplace Features 📋 PLANNED

**Listing Management** (Seller):
- View my listings
- Edit active listings
- Mark as sold manually
- Delete listing
- Relist item

**Order Management** (Buyer):
- View purchase history
- Track order status
- Download purchased files
- Request refund/support

**Search & Discovery**:
- Full-text search
- Trending items
- Recently added
- Popular in your university
- Recommended for you

**Trust & Safety**:
- Report listing
- Block seller
- Review system
- Verified student badge
- Transaction history

---

## Database Schema

### MarketplaceListing
```python
id: Integer (PK)
seller_id: Integer (FK to User)
title: String(200)
description: Text
category: String(50)
price: Decimal(10,2)
currency: String(3)
university: String(100)
faculty: String(100)
course: String(100)
condition: String(20)
is_available: Boolean
is_sold: Boolean
is_one_time_offer: Boolean  # PENDING
images: JSON
file_url: String  # PENDING
file_format: String  # PENDING
tags: JSON  # PENDING (discipline, specialty, etc.)
created_at: DateTime
updated_at: DateTime
```

### MarketplaceOrder
```python
id: Integer (PK)
listing_id: Integer (FK to MarketplaceListing)
buyer_id: Integer (FK to User)
amount: Decimal(10,2)
status: String(20)  # pending, in_escrow, completed, cancelled, disputed
escrow_released: Boolean
file_uploaded: Boolean  # PENDING
delivery_confirmed: Boolean  # PENDING
auto_release_date: DateTime  # PENDING
created_at: DateTime
completed_at: DateTime
```

---

## API Endpoints

### Listings
- **GET** `/api/marketplace/listings` - Get all listings with filters ✅
- **POST** `/api/marketplace/listings` - Create new listing ✅
- **GET** `/api/marketplace/listings/:id` - Get listing details ✅
- **PUT** `/api/marketplace/listings/:id` - Update listing 📋
- **DELETE** `/api/marketplace/listings/:id` - Delete listing 📋
- **GET** `/api/marketplace/my-listings` - Get seller's listings 📋

### Orders
- **POST** `/api/marketplace/orders` - Create order/purchase ✅
- **GET** `/api/marketplace/orders` - Get user's orders 📋
- **GET** `/api/marketplace/orders/:id` - Get order details 📋
- **POST** `/api/marketplace/orders/:id/upload-file` - Seller uploads file 📋
- **POST** `/api/marketplace/orders/:id/confirm` - Buyer confirms receipt 📋
- **POST** `/api/marketplace/orders/:id/dispute` - Raise dispute 📋

### Search & Filters
- **GET** `/api/marketplace/categories` - Get all categories 📋
- **GET** `/api/marketplace/universities` - Get universities list 📋
- **GET** `/api/marketplace/search?q=query` - Full-text search 📋

---

## UI Components

### Existing Components
✅ **MarketplacePage** - Main marketplace view with listings grid
✅ **Create Listing Dialog** - Form to create new listing
✅ **Listing Card** - Individual listing display
✅ **Search Bar** - Quick search input

### Components to Create
📋 **AdvancedFiltersPanel** - Multi-filter sidebar/drawer
📋 **ListingDetailModal** - Full listing view with seller profile
📋 **SellerProfileCard** - Seller info component
📋 **EscrowStatusBadge** - Visual indicator for payment status
📋 **OrderTrackingCard** - Track order progress
📋 **FileUploadZone** - For sellers to upload files
📋 **MyListingsPage** - Seller's listing management
📋 **MyOrdersPage** - Buyer's purchase history
📋 **CategoryBrowser** - Visual category navigation

---

## User Experience Flow

### Buying Flow
1. Browse marketplace → Filter by academic criteria
2. Click listing → View details + seller profile
3. Click "Buy Now" → Funds locked in escrow
4. Wait for seller to upload file
5. Receive notification → Download file
6. Confirm receipt → Funds released to seller

### Selling Flow
1. Click "Create Listing" → Fill form with academic details
2. Set one-time offer toggle if applicable
3. Publish listing → Appears in marketplace
4. Receive order notification → Upload file
5. Buyer confirms → Receive payment
6. Listing auto-removed if one-time offer

---

## Implementation Priority

### Phase 1 (Current - Basic Marketplace) ✅
- [x] Basic listings CRUD
- [x] Simple category filtering
- [x] Create listing form
- [x] Order creation
- [x] Escrow model structure

### Phase 2 (Enhanced Academic Features) 🚧
- [ ] Academic-specific categories and tags
- [ ] Advanced filtering UI
- [ ] Extended listing form fields
- [ ] Seller profile display

### Phase 3 (Escrow & File Management) 📋
- [ ] Wallet integration for escrow
- [ ] File upload for sellers
- [ ] Buyer confirmation flow
- [ ] Auto-release mechanism

### Phase 4 (Polish & Features) 📋
- [ ] One-time offer auto-removal
- [ ] My listings/orders pages
- [ ] Search improvements
- [ ] Trust & safety features

---

## Notes
- Marketplace is designed specifically for academic materials trading
- All transactions use wallet balance (no external payments)
- Escrow system protects both buyers and sellers
- One-time offers prevent duplicate sales of unique items
- Filter system helps students find exactly what they need for their courses
