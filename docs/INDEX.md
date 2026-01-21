# Book Heaven Documentation

Welcome to the Book Heaven documentation. This comprehensive guide covers all aspects of the platform, from setup and configuration to feature implementation and API usage.

## Table of Contents

- [Getting Started](#getting-started)
- [Core Features](#core-features)
- [Infrastructure](#infrastructure)
- [Development](#development)
- [Deployment](#deployment)

---

## Getting Started

### [SETUP.md](SETUP.md)
**Environment Setup Guide**

Complete guide for setting up your development environment:
- Prerequisites and dependencies
- Database configuration (PostgreSQL)
- Environment variables
- Infisical secret management
- Running the development server
- Troubleshooting common issues

**Best for:** New developers setting up the project

### [AUTH_README.md](AUTH_README.md)
**Authentication System**

Deep dive into the authentication system:
- OTP-based registration flow
- Secure session management
- Password reset functionality
- Security features and best practices
- API endpoints for authentication
- Testing authentication flows

**Best for:** Developers implementing auth features

---

## Core Features

### [AI_CHAT.md](AI_CHAT.md)
**AI-Powered Book Chat**

Comprehensive guide to the AI chat system:
- RAG (Retrieval-Augmented Generation) architecture
- Dual AI provider setup (Zhipu AI & Gemini)
- Vector embeddings and semantic search
- API endpoints for chat functionality
- Real-time streaming responses
- Troubleshooting and optimization

**Best for:** Developers working on AI features

### [MARKETPLACE.md](MARKETPLACE.md)
**Marketplace System**

Complete marketplace documentation:
- Book listings and offers
- Real-time messaging with WebSocket
- Seller reviews and reputation
- Negotiation flows
- API endpoints and WebSocket events
- Security considerations

**Best for:** Developers building marketplace features

### [QUIZ_GAMIFICATION.md](QUIZ_GAMIFICATION.md)
**Quiz & Gamification**

Gamification system overview:
- Auto-generated quiz questions
- Achievement system (6 tiers)
- Daily streaks and leaderboards
- XP rewards and scoring
- API endpoints
- Achievement types and requirements

**Best for:** Developers implementing gamification

### [MOOD_RECOMMENDATIONS.md](MOOD_RECOMMENDATIONS.md)
**Mood-Based Recommendations**

Recommendation system guide:
- Mood-to-category mapping
- AI-powered ranking algorithm
- Personalization based on history
- API endpoints
- Frontend integration
- Analytics and tracking

**Best for:** Developers working on recommendations

### [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md)
**Admin Dashboard**

Admin interface documentation:
- Analytics and reporting
- User management
- Book management
- Marketplace moderation
- Support ticket system
- Security and permissions

**Best for:** Admins and developers building admin tools

---

## Infrastructure

### [BOOK_CONTENT_EXTRACTION.md](BOOK_CONTENT_EXTRACTION.md)
**PDF Processing Pipeline**

Technical guide to content extraction:
- PDF download from Google Drive
- Text extraction and chunking
- Content caching strategies
- Processing status tracking
- Error handling and retries

**Best for:** Developers working with PDF processing

### [SUBSCRIPTION_SETUP.md](SUBSCRIPTION_SETUP.md)
**Stripe Subscription Integration**

Payment system setup:
- Stripe account configuration
- Subscription tiers and pricing
- Webhook handling
- Customer management
- Testing payments

**Best for:** Developers implementing payments

### [REFRESH_TOKENS.md](REFRESH_TOKENS.md)
**Token Refresh Mechanism**

Authentication security:
- JWT token architecture
- Refresh token flow
- Security best practices
- Implementation details

**Best for:** Developers working on authentication security

---

## Development

### Implementation Plans

#### [BOOK_CHAT_WITH_AI_PLAN.md](BOOK_CHAT_WITH_AI_PLAN.md)
Original implementation plan for AI chat feature.

#### [BOOK_CHAT_ZHIPU_AI_PLAN.md](BOOK_CHAT_ZHIPU_AI_PLAN.md)
Detailed plan for Zhipu AI integration.

#### [BOOK_SERIES_IMPLEMENTATION.md](BOOK_SERIES_IMPLEMENTATION.md)
Guide for implementing book series functionality.

#### [BOOK_SUGGESTIONS_PLAN.md](BOOK_SUGGESTIONS_PLAN.md)
Book suggestions and recommendation system planning.

#### [INFO_TOOLTIP_COMPONENT_PLAN.md](INFO_TOOLTIP_COMPONENT_PLAN.md)
UI component implementation guide.

---

## Quick Reference

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/book_heaven
EMBEDDING_DATABASE_URL=postgresql://user:pass@host:5432/embeddings_db

# Authentication
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# AI Services
ZHIPU_AI_API_KEY=your-zhipu-key
GEMINI_API_KEY=your-gemini-key

# Payment
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### Common Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:ws           # Start WebSocket server
npm run dev:plain        # Start without Infisical

# Database
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Visual database explorer

# Build
npm run build            # Build for production
npm start                # Start production server
```

### API Base Paths

| Feature | Base Path | Description |
|---------|-----------|-------------|
| Auth | `/api/auth` | Authentication endpoints |
| Books | `/api/books` | Book CRUD and chat |
| Marketplace | `/api/marketplace` | Marketplace APIs |
| Admin | `/api/admin` | Admin endpoints |
| Quiz | `/api/quiz` | Quiz and leaderboard |
| User | `/api/user` | User settings and profile |

---

## Architecture Overview

```
┌───────────────────────────────────────────────┐
│                   Frontend                    │
│     (Next.js, React, Tailwind, Shadcn UI)    │
└───────────────────────────────────────────────┘
                       │
┌───────────────────────────────────────────────┐
│                  API Layer                    │
│         (Next.js API Routes, Middleware)      │
└───────────────────────────────────────────────┘
                       │
┌───────────────────────────────────────────────┐
│              Business Logic                   │
│      (Services, Repositories, Validators)     │
└───────────────────────────────────────────────┘
                       │
┌───────────────────────────────────────────────┐
│               Data Layer                      │
│      (Prisma ORM, PostgreSQL, Redis)          │
└───────────────────────────────────────────────┘
                       │
┌───────────────────────────────────────────────┐
│            External Services                  │
│  (AI APIs, Stripe, Google Drive, Resend)     │
└───────────────────────────────────────────────┘
```

---

## Database Schema Overview

### Core Models (40+ total)

**User Management**
- User, UserSession, UserOtp
- OnlineStatus, TypingIndicator

**Content**
- Book, Author, Translator, Publication
- Category, Series, Mood
- Bookshelf, BookshelfItem

**AI & Chat**
- BookChatMessage, BookChatContext
- BookQuestion, PdfProcessingJob

**Marketplace**
- BookSellPost, BookOffer, Conversation
- Message, SellerReview

**Gamification**
- QuizAttempt, QuizStreak
- Achievement, UserAchievement

**Analytics**
- BookView, AuthorView, CategoryView
- ActivityLog, SellPostView

**System**
- SystemSettings, Notice, SupportTicket
- Campaign, LegalContent

[View Full Schema](../prisma/schema.prisma)

---

## Project Structure

```
book-heaven/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (dashboard)/      # Admin dashboard
│   │   ├── (public)/         # Public pages
│   │   ├── (user)/           # User pages
│   │   └── api/              # API endpoints
│   ├── components/           # React components
│   │   ├── ui/              # Shadcn UI base
│   │   ├── books/           # Book components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── marketplace/     # Marketplace components
│   │   └── auth/            # Auth components
│   ├── lib/                 # Business logic
│   │   ├── auth/           # Auth services
│   │   ├── books/          # Book logic
│   │   ├── ai/             # AI integrations
│   │   ├── marketplace/    # Marketplace logic
│   │   └── prisma.ts       # Prisma client
│   ├── types/              # TypeScript types
│   ├── context/            # React contexts
│   └── hooks/              # Custom hooks
├── docs/                   # Documentation
├── server.ts              # WebSocket server
└── README.md              # Main README
```

---

## Support

### Getting Help

1. **Documentation** - Check relevant docs above
2. **Issues** - Report bugs on GitHub
3. **Discussions** - Ask questions in discussions
4. **Support Tickets** - Use in-app support system

### Contributing

We welcome contributions! Please see the main [README.md](../README.md) for contribution guidelines.

---

## Changelog

### Recent Updates

- **v1.0.0** (2024-01-21)
  - Initial documentation structure
  - Feature-specific documentation
  - API reference
  - Architecture guides

---

**Last Updated:** January 21, 2024

**Maintained By:** Book Heaven Team
