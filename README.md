<div align="center">

# Book Heaven

### AI-Powered Digital Library & Community Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## Overview

**Book Heaven** is a modern, full-featured digital library platform that combines AI-powered book chat, mood-based recommendations, marketplace functionality, and community features in one cohesive application.

Built with Next.js 16, TypeScript, and PostgreSQL, it provides a comprehensive solution for book management, AI-assisted reading, and community engagement.

## Features

- **AI-Powered Book Chat** - Context-aware conversations with RAG (Retrieval-Augmented Generation)
- **Digital Library Management** - Support for eBooks, audiobooks, and hard copies
- **Mood-Based Recommendations** - Personalized book suggestions based on your mood
- **Quiz & Gamification** - Auto-generated questions, streaks, leaderboards, and achievements
- **Marketplace** - Buy/sell books with real-time messaging and negotiation
- **Subscription System** - Stripe-powered premium tiers
- **Admin Dashboard** - Comprehensive analytics and management tools

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/book-heaven.git
cd book-heaven

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

For detailed documentation, see the [docs/](docs/) folder:

| Category | Documents |
|----------|-----------|
| **Getting Started** | [INDEX.md](docs/INDEX.md) • [SETUP.md](docs/SETUP.md) |
| **Core Features** | [AI_CHAT.md](docs/AI_CHAT.md) • [MARKETPLACE.md](docs/MARKETPLACE.md) • [QUIZ_GAMIFICATION.md](docs/QUIZ_GAMIFICATION.md) • [MOOD_RECOMMENDATIONS.md](docs/MOOD_RECOMMENDATIONS.md) |
| **Infrastructure** | [BOOK_CONTENT_EXTRACTION.md](docs/BOOK_CONTENT_EXTRACTION.md) • [SUBSCRIPTION_SETUP.md](docs/SUBSCRIPTION_SETUP.md) • [AUTH_README.md](docs/AUTH_README.md) |
| **Admin** | [ADMIN_DASHBOARD.md](docs/ADMIN_DASHBOARD.md) |

**[View Full Documentation Index →](docs/INDEX.md)**

## Project Structure

```
book-heaven/
├── prisma/
│   └── schema.prisma          # Database schema (40+ models)
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (dashboard)/      # Admin dashboard
│   │   ├── (public)/         # Public pages
│   │   └── api/              # API endpoints
│   ├── components/           # React components
│   ├── lib/                  # Business logic
│   └── types/                # TypeScript types
├── docs/                     # Documentation
└── server.ts                 # WebSocket server
```

## Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn UI

**Backend:** Node.js, Next.js API Routes, Prisma ORM, PostgreSQL

**Services:** Zhipu AI, Gemini AI, Stripe, Google Drive, Resend

**Real-time:** Socket.io, Redis, BullMQ

## API Endpoints

### Authentication
- `POST /api/auth/register/send-otp` - Send registration OTP
- `POST /api/auth/register/verify-otp` - Verify OTP
- `POST /api/auth/login` - Login

### Books
- `GET /api/books` - List books with pagination
- `GET /api/books/[id]` - Get book details
- `POST /api/books/[id]/chat` - AI chat with book

### Marketplace
- `GET /api/marketplace/posts` - Browse listings
- `POST /api/marketplace/offers` - Make an offer

## Development

```bash
# Development with Infisical (recommended)
npm run dev

# Plain development (using .env.local)
npm run dev:plain

# WebSocket server (in separate terminal)
npm run dev:ws

# Build for production
npm run build

# Start production server
npm start
```

## Database

The application uses PostgreSQL with Prisma ORM. The schema includes 40+ models covering:

- User management and authentication
- Books, authors, categories, series
- Marketplace and transactions
- AI chat and embeddings
- Analytics and activity logs

View the database with:
```bash
npx prisma studio
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by the Book Heaven Team**

</div>
