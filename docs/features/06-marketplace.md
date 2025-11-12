# Marketplace Feature

**Status:** ✅ **COMPLETED**

## Overview
Student-to-student marketplace for buying and selling items with escrow payment protection.

## Purpose
- Enable student commerce
- Safe buying/selling platform
- Escrow payment system
- Category-based browsing
- Item listing management

## Location
- **Frontend:** `src/features/marketplace/pages/MarketplacePage.tsx`
- **Backend:** `backend/app/blueprints/marketplace.py`
- **API:** `src/lib/api.ts` (marketplaceAPI)

## Components

### MarketplacePage
- Create listing dialog
- Browse available listings
- Category filtering
- Buy now functionality
- Seller's own listings view
- Order management

## Functionality

### Implemented Features ✅
- [x] Create product listings
- [x] Browse all active listings
- [x] Filter by category
- [x] Purchase items with escrow
- [x] Seller listing management
- [x] Order creation
- [x] Per-listing loading states
- [x] Price validation
- [x] Category selection
- [x] Description and images (planned)

## Technical Implementation

### Create Listing
```typescript
createListing({
  title: string,
  description: string,
  category: string,
  price: number
})
```

### Purchase Flow
```typescript
createOrder(listingId) => {
  1. Deduct price from buyer's wallet
  2. Hold funds in escrow
  3. Create order record
  4. Notify seller
  5. Mark listing as sold
}
```

### Categories
- Books & Textbooks
- Electronics
- Furniture
- Clothing
- Sports Equipment
- Other

### Per-Item Loading States
```typescript
// Set-based approach for concurrent purchases
const [buyingListingIds, setBuyingListingIds] = useState<Set<number>>(new Set());

// Can buy multiple items simultaneously
- Add listing ID to Set when buying
- Remove from Set on success/error
- Only specific listing button disabled
```

## Database Schema
```sql
marketplace_listings (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
)

marketplace_orders (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES marketplace_listings(id),
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Order Status Flow
1. **Pending** - Order created, payment held in escrow
2. **Completed** - Seller confirms delivery, funds released
3. **Cancelled** - Buyer cancels, funds refunded
4. **Disputed** - Issue raised, admin review needed

## Escrow System
```python
def create_order(listing_id, buyer_id):
    # 1. Verify buyer has funds
    if buyer.wallet.balance < listing.price:
        raise InsufficientFundsError
    
    # 2. Deduct from buyer
    buyer.wallet.balance -= listing.price
    
    # 3. Create order (funds in escrow)
    order = Order(
        listing_id=listing_id,
        buyer_id=buyer_id,
        seller_id=listing.seller_id,
        amount=listing.price,
        status='pending'
    )
    
    # 4. Update listing status
    listing.status = 'sold'
    
    # 5. When confirmed, credit seller
    # seller.wallet.balance += order.amount
```

## Security Features
- Escrow payment protection
- Seller verification
- Buyer wallet balance check
- Fraud prevention (planned)
- Dispute resolution system (planned)

## UI/UX Features
- Card-based listing display
- Category badges
- Price highlighting
- Empty state for no listings
- Loading states during purchases
- Toast notifications
- Smooth animations
- Responsive grid layout

## Integration Points
- **Wallet**: Deducts funds from buyer
- **Transactions**: Creates transaction records
- **Notifications**: Notifies buyer and seller (planned)
- **Profile**: Seller ratings (planned)

## Error Handling
- Insufficient funds error
- Listing not found
- Listing already sold
- Self-purchase prevention
- Negative price validation

## Listing Management
### Seller Actions
- Create new listings
- Edit listings (planned)
- Delete listings (planned)
- Mark as sold
- View orders

### Buyer Actions
- Browse all listings
- Filter by category
- Purchase items
- View order history (planned)
- Request refunds (planned)

## Future Enhancements
- [ ] Image upload for listings
- [ ] Listing edit functionality
- [ ] Seller ratings and reviews
- [ ] Saved/favorite listings
- [ ] Search functionality
- [ ] Advanced filtering (price range, condition)
- [ ] Messaging between buyer/seller
- [ ] Shipping options
- [ ] Pickup locations
- [ ] Listing expiration
- [ ] Featured listings
- [ ] Marketplace analytics for sellers
- [ ] Buyer protection guarantee
- [ ] Return/refund system
