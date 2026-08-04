# Book Heaven

**A digital library, reading companion, and community marketplace in one application.**

[![Live app](https://img.shields.io/badge/live-bookheavenbeta.vercel.app-000000?logo=vercel)](https://bookheavenbeta.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Support on SupportKori](https://img.shields.io/badge/support-SupportKori-ffdd00)](https://www.supportkori.com/montasim)

Book Heaven brings searchable digital and physical collections, browser-based
reading, AI-assisted book conversations, quizzes, community publishing, and a
buy/sell marketplace into a single Next.js application. Readers can discover
and organize books; librarians and administrators get publishing, moderation,
analytics, and content-processing workflows.

**[Explore Book Heaven](https://bookheavenbeta.vercel.app)** ·
[Browse the documentation](docs/INDEX.md)

> **Project status:** Book Heaven is a broad beta application with several
> external services. Browsing depends mainly on PostgreSQL and stored content;
> AI chat, email, file storage, payments, asynchronous processing, OAuth, and
> real-time messaging each require their own credentials or infrastructure.

## Why Book Heaven?

Reading platforms, library catalogs, book communities, and second-hand
marketplaces are usually separate products. That fragments discovery, reading
progress, conversation, and administration. Book Heaven explores one connected
workflow while keeping optional services modular so a local deployment can
start with the catalog and add richer capabilities deliberately.

## Reader experience

- Browse digital books, physical-library holdings, authors, translators,
  publications, series, categories, blog posts, and notices.
- Open supported digital books in the in-browser reader and maintain personal
  shelves, uploads, reading history, and borrowed-book records.
- Ask questions about processed book content through a retrieval-assisted chat
  workflow with ZhipuAI and Gemini provider support.
- Discover books through mood-based recommendations and take generated quizzes
  with achievements, streaks, and a leaderboard.
- List and browse second-hand books, exchange offers, and continue negotiations
  through marketplace conversations.
- Create an account with email verification or configured Google/GitHub OAuth.

## Library and administration

- Manage books, authors, translators, publications, categories, series,
  notices, blog content, legal pages, FAQs, pricing, and site settings.
- Upload and process book files, covers, author media, and audio assets through
  the configured Google Drive and processing services.
- Review reader activity, book analytics, AI usage and cost data, marketplace
  activity, contact submissions, and support tickets.
- Configure Stripe-backed subscription tiers and webhook processing.
- Connect marketplace messaging to a separately deployed Socket.IO service,
  while clients can fall back to HTTP polling when it is unavailable.

## Using Book Heaven

### Discover and read

1. Open the [live catalog](https://bookheavenbeta.vercel.app).
2. Browse or filter books, authors, categories, publications, and series.
3. Open a book to review its metadata and available digital, audio, or physical
   access options.
4. Sign in to save progress, organize shelves, borrow supported titles, or
   upload content where the deployment permits it.
5. For processed digital books, open the reader or ask a book-content question;
   verify AI responses against the source text.

### Use the marketplace and community

1. Open **Marketplace** to browse a listing or create one after signing in.
2. Send an offer and continue the discussion through the conversation view.
3. Use blog, notice, quiz, leaderboard, and public-profile pages to participate
   in the wider reading community.

### Operate a library

Authorized administrators use the dashboard to create catalog entities,
publish notices and site content, process uploaded books, review analytics and
support activity, and configure pricing. Complete only the integrations needed
by the enabled workflows and verify authorization before importing real data.

## Architecture

```mermaid
flowchart LR
  Web[Next.js web application] --> API[App Router APIs]
  API --> DB[(PostgreSQL / Prisma)]
  API --> Drive[Google Drive]
  API --> AI[ZhipuAI / Gemini]
  API --> Mail[Resend]
  API --> Stripe[Stripe]
  API --> Jobs[Redis / BullMQ]
  Web <--> Socket[Socket.IO service]
```

The Next.js application owns the public site, authenticated reader areas,
administration dashboard, and HTTP APIs. Prisma models the application data in
PostgreSQL. Clients can connect to a separately deployed Socket.IO service, and
external processing and storage integrations are kept behind server-side
routes. The default branch does not contain that socket server's source.

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js 16, React 19, TypeScript 5 |
| Interface | Tailwind CSS, shadcn/ui, Radix UI |
| Data | PostgreSQL, Prisma 7 |
| AI and retrieval | ZhipuAI, Gemini, optional pgvector database |
| Storage and media | Google Drive, Tinify, aPDF.io-compatible processing |
| Email and payments | Resend, Stripe |
| Background and real-time | Redis, BullMQ, Socket.IO |
| Validation and client data | Zod, React Query, SWR, Zustand |
| Deployment | Vercel plus optional supporting services |

## Run locally

### Requirements

- Node.js 20.19 or newer
- npm
- PostgreSQL
- Infisical CLI only if you use the default secret-managed `dev` or `build`
  scripts

```bash
git clone https://github.com/montasim/book-heaven.git
cd book-heaven
cp .env.example .env.local
```

Uncomment and set `DATABASE_URL` plus the variables for the workflows you plan
to run. Then install, prepare the database, and start without Infisical:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev:plain
```

Open <http://localhost:3000>.

The checked-in `.env.example` is a reference template: many server-side
variables are commented out because production secrets are normally injected
through Infisical. Uncomment and replace the values required by the workflows
you plan to exercise. Never commit `.env.local` or exported Infisical secrets.
The default branch does not currently include a lockfile, so dependency
resolution is not byte-for-byte reproducible across fresh installs; review the
resolved versions before production use.

### Minimum configuration

| Variable | Required for | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Application | PostgreSQL connection used by Prisma |
| `BASE_URL`, `NEXT_PUBLIC_APP_URL` | Application | Server and browser origins |
| `JWT_SECRET` | Authentication | Strong secret for custom tokens and OAuth callback state |
| `RESEND_API_KEY`, `FROM_EMAIL` | OTP and notification email | Resend credentials and verified sender |
| `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID` | Managed media | Google service account and Drive folder |
| `ZHIPU_AI_API_KEY` | Primary AI chat | ZhipuAI provider key |
| `GEMINI_API_KEY` | AI fallback and embeddings | Gemini provider key |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Subscriptions | Stripe server, webhook, and browser keys |
| `NEXT_PUBLIC_WS_URL`, `WEBSOCKET_SERVER_URL`, `WEBSOCKET_API_KEY` | Live marketplace messaging | Socket service URLs and shared authentication key |
| `PDF_PROCESSOR_URL`, `PDF_PROCESSOR_API_KEY` | Book processing | External processor endpoint and service key |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Queues and socket scaling | Redis connection |

### Complete environment reference

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Primary PostgreSQL database used by Prisma |
| `NODE_ENV` | Development or production behavior |
| `BASE_URL` | Server-side application origin |
| `NEXT_PUBLIC_APP_URL` | Browser-visible canonical application origin |
| `JWT_SECRET` | Signs custom authentication tokens and OAuth callback state |
| `RESEND_API_KEY` | Resend email delivery |
| `FROM_EMAIL` | Verified email sender |
| `ZHIPU_AI_API_KEY`, `ZHIPU_AI_MODEL` | Primary AI key and model |
| `GEMINI_API_KEY`, `GEMINI_CHAT_MODEL`, `GEMINI_EMBEDDING_MODEL` | Gemini chat fallback and embeddings |
| `EMBEDDING_DATABASE_URL` | Optional pgvector-compatible embeddings database |
| `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID` | Google Drive service-account storage |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | Google user OAuth |
| `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` | GitHub user OAuth |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Backward-compatible GitHub OAuth aliases |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile server and browser keys |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe server and webhook secrets |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Browser-visible Stripe key |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID`, `STRIPE_PREMIUM_YEARLY_PRICE_ID` | Premium tier Stripe prices |
| `STRIPE_PREMIUM_PLUS_MONTHLY_PRICE_ID`, `STRIPE_PREMIUM_PLUS_YEARLY_PRICE_ID` | Premium Plus Stripe prices |
| `TINIFY_API_KEY`, `APDF_API_KEY` | Image and PDF compression services |
| `QUIZ_API_BASE_URL`, `QUIZ_API_TIMEOUT`, `QUIZ_API_MAX_RETRIES` | Quiz provider endpoint and retry behavior |
| `PDF_PROCESSOR_URL`, `PDF_PROCESSOR_API_KEY` | External book processor |
| `SOCKET_SERVER_URL`, `WEBHOOK_API_KEY` | Server-side socket/webhook integration |
| `NEXT_PUBLIC_WS_URL`, `WEBSOCKET_SERVER_URL`, `WEBSOCKET_API_KEY` | Browser/server marketplace messaging |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Redis connection |
| `CRON_SECRET` | Authenticates scheduled loan-reminder requests |
| `CLEANUP_API_KEY` | Authenticates the auth-cleanup endpoint |
| `LOG_LEVEL` | Server log verbosity |

OAuth, Stripe price IDs, Turnstile, provider model selection, and other
optional settings are described in [`.env.example`](.env.example). The more
focused authentication walkthrough is in [`docs/SETUP.md`](docs/SETUP.md).

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Next.js with `dev` secrets injected by Infisical |
| `npm run dev:plain` | Run Next.js from local environment files |
| `npm run build` | Build Next.js with `prod` secrets from Infisical |
| `npm run build:normal` | Generate Prisma Client and build from the current environment |
| `npm run build:plain` | Build Next.js without first generating Prisma Client |
| `npm run start` | Serve the production Next.js build |
| `npm run lint` | Run ESLint |

`package.json` currently declares `dev:ws` and `start:ws`, but the referenced
`server.ts` is not present on the default branch. Those two scripts are not a
reproducible path until the socket-server source is restored; use the configured
external socket service or HTTP polling fallback instead.

Use `npx prisma studio` to inspect a configured development database. Schema
migrations live under `prisma/migrations/` and should be reviewed before they
are applied to shared or production data.

## Documentation

| Topic | Guide |
| --- | --- |
| Documentation map | [`docs/INDEX.md`](docs/INDEX.md) |
| Authentication and local services | [`docs/SETUP.md`](docs/SETUP.md) and [`docs/AUTH_README.md`](docs/AUTH_README.md) |
| AI book chat | [`docs/AI_CHAT.md`](docs/AI_CHAT.md) |
| Content extraction | [`docs/BOOK_CONTENT_EXTRACTION.md`](docs/BOOK_CONTENT_EXTRACTION.md) |
| Mood recommendations | [`docs/MOOD_RECOMMENDATIONS.md`](docs/MOOD_RECOMMENDATIONS.md) |
| Quizzes and gamification | [`docs/QUIZ_GAMIFICATION.md`](docs/QUIZ_GAMIFICATION.md) |
| Marketplace | [`docs/MARKETPLACE.md`](docs/MARKETPLACE.md) |
| Subscriptions | [`docs/SUBSCRIPTION_SETUP.md`](docs/SUBSCRIPTION_SETUP.md) |
| Administration | [`docs/ADMIN_DASHBOARD.md`](docs/ADMIN_DASHBOARD.md) |

Some files in `docs/` describe implementation plans as well as shipped
behavior. Confirm planned work against routes, database models, and the running
application before relying on it operationally.

## Project map

```text
src/app/               Public, authenticated, admin, and API routes
src/components/        Shared and feature-facing React components
src/lib/               Auth, AI, storage, jobs, payments, and domain services
src/types/             Shared TypeScript contracts
prisma/                PostgreSQL schema and migrations
docs/                  Setup, feature, and operational notes
```

## Deployment

The maintained beta is hosted at
[bookheavenbeta.vercel.app](https://bookheavenbeta.vercel.app). A complete
deployment may also include PostgreSQL, Google Drive, Redis, a Socket.IO
service, the PDF processor, Resend, AI providers, and Stripe. Store secrets in
the deployment platform or Infisical, use production callback URLs, and apply
database migrations as an explicit release step.

## Security and limitations

- Uploaded books may be copyrighted or sensitive. Deployers are responsible
  for permissions, access rules, takedown handling, and storage retention.
- AI answers and generated quizzes can be incorrect; retain links to source
  content and do not treat generated output as authoritative.
- Payment and webhook flows require HTTPS, verified webhook signatures, and
  production Stripe configuration.
- Real-time messaging is optional; HTTP polling is the documented fallback.
- The checked-in WebSocket scripts reference a missing `server.ts` and cannot
  currently start a local socket process from this branch.
- The repository has no committed automated test command. A successful build
  and lint run do not replace integration testing of configured services.

Report sensitive vulnerabilities privately through the contact links on
[the maintainer's GitHub profile](https://github.com/montasim), not in a public
issue.

## Contributing

Focused bug fixes and documentation improvements are welcome. Open an issue or
pull request with the behavior being changed, migration or configuration
impact, and the checks performed. Keep feature-plan documents clearly
separated from current behavior.

The repository currently has no dedicated `CONTRIBUTING.md`, `SECURITY.md`,
`CODE_OF_CONDUCT.md`, or `SUPPORT.md`. Use
[Issues](https://github.com/montasim/book-heaven/issues) for public reports,
[Pull Requests](https://github.com/montasim/book-heaven/pulls) for reviewable
changes, and the maintainer's profile for sensitive security reports.

If Book Heaven is useful to you, optional support through
[SupportKori](https://www.supportkori.com/montasim) helps fund hosting and
continued development.

## Funding

Optional SupportKori contributions help cover hosting, service integration
testing, and continued maintenance. Documentation, testing, and focused code
contributions are equally valuable.

[![Support Book Heaven on SupportKori](https://img.shields.io/badge/Support_Book_Heaven-SupportKori-00B8B5?style=for-the-badge)](https://www.supportkori.com/montasim)

## License

Licensed under the [MIT License](LICENSE).

## Maintainer

[Mohammad Montasim Al Mamun Shuvo](https://github.com/montasim)
