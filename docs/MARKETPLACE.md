# Marketplace

## Overview

The Book Heaven Marketplace is a peer-to-peer book trading platform where users can buy and sell books directly with each other. It features real-time messaging, offer negotiation, seller reviews, and secure transactions.

## Features

- **Book Listings** - Create detailed book sale listings
- **Offer System** - Make and negotiate offers
- **Real-Time Messaging** - WebSocket-powered chat
- **Seller Reviews** - Reputation and trust system
- **Online Status** - See when sellers are active
- **Analytics** - Track views and engagement

## Architecture

### Flow Diagram

```
Seller lists book → Buyer browses → Buyer makes offer
                                    ↓
                          Seller responds (accept/reject/counter)
                                    ↓
                          Real-time chat negotiation
                                    ↓
                          Transaction complete → Review left
```

### Real-Time Features

The marketplace uses WebSocket for:
- Real-time messaging between buyers and sellers
- Online/offline status indicators
- Typing indicators
- Instant notifications for offers and messages

## Database Models

### BookSellPost
Main marketplace listing model:

```prisma
model BookSellPost {
  id                String          @id
  title             String
  description       String?         @db.Text
  price             Float
  negotiable        Boolean         @default(true)
  condition         BookCondition
  images            String[]        // Image URLs
  bookId            String?         // Link to Book model
  sellerId          String
  location          String?
  city              String?
  status            SellPostStatus  @default(AVAILABLE)
  expiresAt         DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  seller            User            @relation("UserSellPosts")
  offers            BookOffer[]
  conversations     Conversation[]
  reviews           SellerReview[]
  views             SellPostView[]
}

enum BookCondition {
  NEW
  LIKE_NEW
  GOOD
  FAIR
  POOR
}

enum SellPostStatus {
  AVAILABLE
  PENDING
  SOLD
  EXPIRED
  HIDDEN
}
```

### BookOffer
Purchase offers from buyers:

```prisma
model BookOffer {
  id              String        @id
  sellPostId      String
  buyerId         String
  offeredPrice    Float
  message         String?       @db.Text
  status          OfferStatus   @default(PENDING)
  respondedAt     DateTime?
  responseMessage String?       @db.Text

  sellPost        BookSellPost  @relation(fields: [sellPostId])
  buyer           User          @relation("UserBuyerOffers")
}

enum OfferStatus {
  PENDING
  ACCEPTED
  REJECTED
  COUNTERED
  WITHDRAWN
  EXPIRED
}
```

### Conversation
Negotiation chats:

```prisma
model Conversation {
  id                    String             @id
  sellPostId            String
  sellerId              String
  buyerId               String
  status                ConversationStatus @default(ACTIVE)
  transactionCompleted   Boolean            @default(false)
  completedAt           DateTime?

  messages              Message[]
  review                SellerReview?
  typingIndicators      TypingIndicator[]

  @@unique([sellPostId, buyerId])
}

enum ConversationStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
  BLOCKED
}
```

### Message
Chat messages:

```prisma
model Message {
  id             String       @id
  conversationId String
  senderId       String
  content        String       @db.Text
  readAt         DateTime?
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId])
  sender         User         @relation("UserSentMessages")
}
```

### SellerReview
Post-transaction reviews:

```prisma
model SellerReview {
  id                    String   @id
  conversationId        String   @unique
  sellPostId            String
  reviewerId            String   // Buyer
  sellerId              String   // Seller
  rating                Int      // 1-5 stars
  communicationRating   Int
  descriptionAccuracyRating Int
  meetupRating          Int
  comment               String?  @db.Text
  createdAt             DateTime @default(now())
}
```

## API Endpoints

### Listings

#### GET /api/marketplace/posts
Browse marketplace listings.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `condition`: Filter by condition
- `minPrice`, `maxPrice`: Price range
- `city`: Filter by location
- `search`: Search in title/description

**Response:**
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "title": "The Great Gatsby",
      "description": "First edition, like new",
      "price": 29.99,
      "condition": "LIKE_NEW",
      "images": ["url1", "url2"],
      "seller": {
        "id": "seller-uuid",
        "name": "John Doe",
        "avatar": "avatar-url"
      },
      "location": "New York, NY",
      "createdAt": "2024-01-21T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

#### POST /api/marketplace/posts
Create a new listing.

**Request:**
```json
{
  "title": "Book Title",
  "description": "Book description",
  "price": 29.99,
  "negotiable": true,
  "condition": "GOOD",
  "images": ["https://example.com/image1.jpg"],
  "bookId": "optional-book-uuid",
  "location": "New York, NY",
  "city": "New York"
}
```

#### GET /api/marketplace/posts/[id]
Get listing details.

#### PUT /api/marketplace/posts/[id]
Update your listing.

#### DELETE /api/marketplace/posts/[id]
Delete your listing.

### Offers

#### POST /api/marketplace/offers
Make an offer on a listing.

**Request:**
```json
{
  "sellPostId": "post-uuid",
  "offeredPrice": 25.00,
  "message": "Is this still available?"
}
```

#### PUT /api/marketplace/offers/[id]
Respond to an offer (seller only).

**Request:**
```json
{
  "status": "ACCEPTED", // or "REJECTED", "COUNTERED"
  "responseMessage": "Great! Let's meet up.",
  "counteredPrice": 27.00
}
```

### Conversations

#### GET /api/marketplace/conversations
Get all conversations.

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "sellPost": {
        "id": "post-uuid",
        "title": "The Great Gatsby",
        "image": "image-url"
      },
      "otherParty": {
        "id": "user-uuid",
        "name": "Jane Doe",
        "online": true
      },
      "lastMessage": {
        "content": "See you tomorrow!",
        "createdAt": "2024-01-21T11:00:00Z"
      },
      "unreadCount": 2
    }
  ]
}
```

#### POST /api/marketplace/conversations/[id]/messages
Send a message.

**Request:**
```json
{
  "content": "Is the book still available?"
}
```

#### GET /api/marketplace/conversations/[id]/messages
Get conversation history.

### Reviews

#### POST /api/marketplace/reviews
Leave a review after transaction.

**Request:**
```json
{
  "conversationId": "conv-uuid",
  "rating": 5,
  "communicationRating": 5,
  "descriptionAccuracyRating": 5,
  "meetupRating": 4,
  "comment": "Great seller, highly recommend!"
}
```

#### GET /api/marketplace/sellers/[id]/reviews
Get seller's reviews.

## WebSocket Events

### Client → Server

```typescript
// Join conversation room
socket.emit('join_conversation', { conversationId: 'conv-uuid' });

// Send message
socket.emit('send_message', {
  conversationId: 'conv-uuid',
  content: 'Hello!'
});

// Start typing
socket.emit('typing_start', { conversationId: 'conv-uuid' });

// Stop typing
socket.emit('typing_stop', { conversationId: 'conv-uuid' });

// Mark as read
socket.emit('mark_read', { conversationId: 'conv-uuid' });
```

### Server → Client

```typescript
// New message received
socket.on('new_message', (data) => {
  // { conversationId, message, sender }
});

// User is typing
socket.on('user_typing', (data) => {
  // { conversationId, userId }
});

// User stopped typing
socket.on('user_stopped_typing', (data) => {
  // { conversationId, userId }
});

// Online status changed
socket.on('online_status', (data) => {
  // { userId, status: 'online' | 'offline' }
});

// New offer received
socket.on('new_offer', (data) => {
  // { sellPostId, offer }
});
```

## Frontend Integration

### Creating a Listing

```typescript
async function createListing(data: CreateListingData) {
  const response = await fetch('/api/marketplace/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error('Failed to create listing');

  return response.json();
}
```

### Real-Time Chat

```typescript
// Setup WebSocket connection
const socket = io(process.env.NEXT_PUBLIC_WS_URL);

// Join conversation
socket.emit('join_conversation', { conversationId });

// Listen for new messages
socket.on('new_message', ({ message }) => {
  appendMessageToUI(message);
  markMessagesAsRead();
});

// Send message
function sendMessage(content: string) {
  socket.emit('send_message', {
    conversationId,
    content
  });
}

// Handle typing indicators
socket.on('user_typing', ({ userId }) => {
  showTypingIndicator(userId);
});

socket.on('user_stopped_typing', ({ userId }) => {
  hideTypingIndicator(userId);
});
```

### Making an Offer

```typescript
async function makeOffer(sellPostId: string, price: number, message: string) {
  const response = await fetch('/api/marketplace/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sellPostId,
      offeredPrice: price,
      message
    })
  });

  return response.json();
}
```

## Admin Features

### Analytics Dashboard

Track marketplace metrics:

```typescript
// GET /api/admin/marketplace/analytics
{
  "totalListings": 1250,
  "activeListings": 890,
  "soldThisMonth": 156,
  "totalRevenue": 12450.00,
  "averageSellingPrice": 24.50,
  "topCategories": ["Fiction", "Non-Fiction", "Science"],
  "listingTrend": [/* daily counts */]
}
```

### Moderation

- View all listings
- Remove inappropriate content
- Resolve disputes
- View user reports

## Configuration

### Environment Variables

```env
# WebSocket Server
NEXT_PUBLIC_WS_URL=http://localhost:3001
WEBSOCKET_SERVER_URL=http://localhost:3001
WEBSOCKET_API_KEY=your-websocket-api-key
```

### Listing Limits

```typescript
const MARKETPLACE_CONFIG = {
  maxImagesPerListing: 5,
  maxTitleLength: 100,
  maxDescriptionLength: 2000,
  listingExpiryDays: 30,
  maxOffersPerListing: 50,
  offerExpiryHours: 48
};
```

## Best Practices

### For Sellers

1. **High-Quality Images** - Use clear, well-lit photos
2. **Accurate Descriptions** - Be honest about condition
3. **Fair Pricing** - Research market value
4. **Quick Responses** - Reply to offers promptly
5. **Safe Meetups** - Meet in public places

### For Buyers

1. **Read Descriptions** - Understand what you're buying
2. **Check Reviews** - Look at seller reputation
3. **Ask Questions** - Clarify details before buying
4. **Reasonable Offers** - Make fair offers
5. **Leave Reviews** - Help others with your feedback

## Troubleshooting

### Issue: Messages not delivering

**Cause:** WebSocket not connected

**Solution:**
```typescript
// Check connection status
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected, attempting to reconnect...');
});

// Reconnect manually if needed
socket.connect();
```

### Issue: Can't see seller's online status

**Cause:** Status not being tracked

**Solution:** Ensure WebSocket server is running:
```bash
npm run dev:ws
```

### Issue: Offer not being created

**Cause:** Validation failed

**Solution:** Check required fields:
- `sellPostId` must exist
- `offeredPrice` must be positive
- `message` must be ≤500 characters

## Security Considerations

1. **User Verification** - Verify users before allowing listings
2. **Image Validation** - Scan uploaded images for malware
3. **Spam Prevention** - Rate limit listing creation
4. **Transaction Safety** - Educate users on safe transactions
5. **Dispute Resolution** - Provide support for disputes

## See Also

- [SETUP.md](SETUP.md) - WebSocket server setup
- [AUTH_README.md](AUTH_README.md) - User authentication
