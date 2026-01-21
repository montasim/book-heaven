# Admin Dashboard

## Overview

The Book Heaven Admin Dashboard is a comprehensive management interface for administrators to manage users, books, marketplace, analytics, and system settings. It provides real-time insights and powerful tools for platform administration.

## Features

### Analytics & Reporting
- Real-time dashboard metrics
- User growth tracking
- Book engagement analytics
- Marketplace performance
- Revenue and subscription tracking
- Custom date range filtering

### User Management
- View all users with pagination
- Search and filter users
- User role management (USER, ADMIN, SUPER_ADMIN)
- Ban/unban users
- View user activity and reading history

### Book Management
- Add, edit, delete books
- Upload and process PDFs
- Generate AI summaries and questions
- Manage authors, categories, publications
- Track reading progress
- View book analytics

### Marketplace Moderation
- View all listings
- Remove inappropriate content
- Resolve disputes
- View transaction history
- Seller performance tracking

### Content Management
- Manage blog posts
- Create email campaigns
- Manage FAQs and legal content
- Handle support tickets

### System Settings
- Site configuration
- SEO metadata
- Maintenance mode
- Notice management

## Dashboard Routes

### Main Dashboard

**Route:** `/admin`

**Features:**
- Overview cards (total users, books, listings)
- Growth charts (user signups, book views)
- Recent activity feed
- Quick actions

### User Management

**Route:** `/admin/users`

**Features:**
- User list with search and filters
- Role badges
- Status indicators (active/banned)
- Last active timestamp
- Quick actions menu

**Actions:**
- View user details
- Change role
- Ban/unban user
- View activity log

### Book Management

**Route:** `/admin/books`

**Features:**
- Book list with pagination
- Filters by type, category, status
- Search by title or author
- Processing status indicators
- Quick edit actions

**Actions:**
- Add new book
- Edit book details
- Delete book
- Regenerate AI content
- View analytics

### Marketplace

**Route:** `/admin/marketplace`

**Features:**
- All listings view
- Active/sold/expired filters
- Seller performance metrics
- Transaction history
- Review management

**Actions:**
- View listing details
- Remove listing
- Resolve disputes
- Contact parties

### Analytics

**Route:** `/admin/analytics`

**Features:**
- Custom date range picker
- Metric cards with trends
- Interactive charts
- Export data (CSV)
- Comparison views

**Metrics:**
- User growth
- Book views
- Quiz completion
- Marketplace transactions
- Revenue tracking

### Support

**Route:** `/admin/support`

**Features:**
- Ticket list with priority
- Status filters (open, in progress, resolved)
- Assigned agents
- Response time tracking

**Actions:**
- View ticket details
- Respond to tickets
- Change status/priority
- Assign to agent

## API Endpoints

### Analytics

#### GET /api/admin/analytics/overview
Get dashboard overview metrics.

**Query Parameters:**
- `period`: 'day' | 'week' | 'month' | 'year'

**Response:**
```json
{
  "users": {
    "total": 1250,
    "growth": 15.5,
    "newThisPeriod": 150
  },
  "books": {
    "total": 850,
    "growth": 8.2,
    "addedThisPeriod": 25
  },
  "engagement": {
    "totalViews": 45000,
    "quizCompletions": 1200,
    "avgReadingTime": "45 min"
  },
  "marketplace": {
    "activeListings": 320,
    "soldThisPeriod": 45,
    "revenue": 1250.00
  }
}
```

#### GET /api/admin/analytics/users
Get user analytics.

**Response:**
```json
{
  "totalUsers": 1250,
  "activeUsers": 890,
  "newSignups": [
    { "date": "2024-01-21", "count": 15 }
  ],
  "topUsers": [
    {
      "id": "user-uuid",
      "name": "Jane Doe",
      "booksRead": 45,
      "quizScore": 2500
    }
  ]
}
```

#### GET /api/admin/analytics/books
Get book analytics.

**Response:**
```json
{
  "totalBooks": 850,
  "featured": 50,
  "byType": {
    "EBOOK": 500,
    "AUDIO": 200,
    "HARD_COPY": 150
  },
  "mostViewed": [
    {
      "id": "book-uuid",
      "name": "Book Title",
      "views": 1250,
      "category": "Fiction"
    }
  ]
}
```

### User Management

#### GET /api/admin/users
Get all users with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name or email
- `role`: Filter by role
- `status`: Filter by status (active/banned)

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER",
      "avatar": "avatar-url",
      "isActive": true,
      "isPremium": false,
      "joinedAt": "2024-01-15T10:00:00Z",
      "lastActiveAt": "2024-01-21T11:30:00Z"
    }
  ],
  "total": 1250,
  "page": 1
}
```

#### GET /api/admin/users/[id]
Get user details.

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER",
    "bio": "Avid reader",
    "booksRead": 45,
    "quizScore": 2500,
    "achievements": 12
  },
  "readingHistory": [
    {
      "bookId": "book-uuid",
      "title": "Book Title",
      "completedAt": "2024-01-20T10:00:00Z",
      "rating": 5
    }
  ],
  "activity": [
    {
      "action": "BOOK_VIEWED",
      "resource": "Book Title",
      "timestamp": "2024-01-21T11:00:00Z"
    }
  ]
}
```

#### PUT /api/admin/users/[id]/role
Update user role.

**Request:**
```json
{
  "role": "ADMIN"
}
```

#### PUT /api/admin/users/[id]/ban
Ban or unban user.

**Request:**
```json
{
  "isBanned": true,
  "reason": "Violation of community guidelines"
}
```

### Book Management

#### GET /api/admin/books
Get all books with filters.

**Query Parameters:**
- `page`, `limit`: Pagination
- `type`: Filter by type
- `category`: Filter by category
- `featured`: Filter featured books
- `search`: Search query

**Response:**
```json
{
  "books": [
    {
      "id": "book-uuid",
      "name": "Book Title",
      "type": "EBOOK",
      "image": "image-url",
      "authors": ["Author Name"],
      "categories": ["Fiction"],
      "views": 1250,
      "isPublic": true,
      "featured": false,
      "processingStatus": "completed"
    }
  ],
  "total": 850
}
```

#### POST /api/admin/books
Create new book.

**Request:**
```json
{
  "name": "Book Title",
  "type": "EBOOK",
  "fileUrl": "https://drive.google.com/...",
  "authors": ["author-uuid-1", "author-uuid-2"],
  "categories": ["category-uuid"],
  "publications": ["publication-uuid"],
  "series": ["series-uuid"],
  "isPublic": true,
  "featured": false,
  "requiresPremium": false,
  "language": "en"
}
```

#### PUT /api/admin/books/[id]
Update book details.

#### DELETE /api/admin/books/[id]
Delete book.

#### POST /api/admin/books/[id]/process
Trigger PDF processing.

**Response:**
```json
{
  "success": true,
  "jobId": "job-uuid",
  "status": "pending"
}
```

### Marketplace

#### GET /api/admin/marketplace/posts
Get all marketplace listings.

**Response:**
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "title": "Book Title",
      "price": 29.99,
      "condition": "GOOD",
      "seller": {
        "id": "user-uuid",
        "name": "John Doe"
      },
      "status": "AVAILABLE",
      "views": 125,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 320
}
```

#### DELETE /api/admin/marketplace/posts/[id]
Remove listing.

**Request:**
```json
{
  "reason": "Violation of guidelines"
}
```

#### GET /api/admin/marketplace/analytics
Get marketplace analytics.

**Response:**
```json
{
  "totalListings": 320,
  "activeListings": 250,
  "soldThisMonth": 45,
  "totalRevenue": 5420.00,
  "averagePrice": 28.50,
  "topSellers": [
    {
      "id": "user-uuid",
      "name": "Jane Doe",
      "listings": 25,
      "sold": 20,
      "revenue": 550.00
    }
  ]
}
```

### Support

#### GET /api/admin/support-tickets
Get all support tickets.

**Query Parameters:**
- `status`: Filter by status
- `priority`: Filter by priority
- `assignedTo`: Filter by assignee

**Response:**
```json
{
  "tickets": [
    {
      "id": "ticket-uuid",
      "subject": "Payment issue",
      "category": "billing",
      "priority": "HIGH",
      "status": "OPEN",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "assignedTo": null,
      "createdAt": "2024-01-21T10:00:00Z"
    }
  ]
}
```

#### POST /api/admin/support-tickets/[id]/respond
Respond to ticket.

**Request:**
```json
{
  "message": "I've looked into your issue...",
  "status": "RESOLVED"
}
```

## Frontend Integration

### Dashboard Layout

```typescript
// src/app/(dashboard)/admin/layout.tsx
export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        {children}
      </main>
    </div>
  );
}
```

### Analytics Cards

```typescript
// src/components/admin/AnalyticsCard.tsx
interface AnalyticsCardProps {
  title: string;
  value: string | number;
  growth?: number;
  icon: React.ReactNode;
}

function AnalyticsCard({ title, value, growth, icon }: AnalyticsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {growth !== undefined && (
            <p className={`text-sm ${growth >= 0 ? 'text-green' : 'text-red'}`}>
              {growth >= 0 ? '+' : ''}{growth}%
            </p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}
```

### Data Table with Filters

```typescript
// src/components/admin/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  filters?: Filter[];
  pagination?: boolean;
}

function DataTable<T>({ data, columns, filters, pagination }: DataTableProps<T>) {
  const [filteredData, setFilteredData] = useState(data);
  const [page, setPage] = useState(1);

  // Apply filters
  useEffect(() => {
    let result = data;
    filters?.forEach(filter => {
      result = result.filter(item =>
        filter.predicate(item, filter.value)
      );
    });
    setFilteredData(result);
  }, [data, filters]);

  return (
    <div>
      <FilterBar filters={filters} />
      <table className="w-full">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.slice((page - 1) * 20, page * 20).map((item, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key}>{col.render(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && <Pagination page={page} onChange={setPage} />}
    </div>
  );
}
```

## Configuration

### Admin Settings

```typescript
const ADMIN_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  sessionTimeout: 3600,  // 1 hour
  auditLogging: true,
  require2FA: false  // Future: enable 2FA
};
```

### Permissions

```typescript
const ADMIN_PERMISSIONS = {
  SUPER_ADMIN: [
    'manage_users',
    'manage_books',
    'manage_marketplace',
    'manage_settings',
    'view_analytics'
  ],
  ADMIN: [
    'manage_books',
    'manage_marketplace',
    'view_analytics'
  ],
  USER: []
};
```

## Security

### Access Control

```typescript
// Middleware to check admin role
export async function requireAdminRole(
  request: Request
): Promise<Response | NextResponse> {
  const session = await getSession(request);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    return new Response('Unauthorized', { status: 401 });
  }

  return NextResponse.next();
}
```

### Audit Logging

```typescript
// Log all admin actions
await prisma.activityLog.create({
  data: {
    userId: adminId,
    action: 'USER_BANNED',
    resourceType: 'USER',
    resourceId: userId,
    description: `Banned user: ${reason}`,
    ipAddress: request.ip,
    userAgent: request.headers.get('user-agent')
  }
});
```

## Best Practices

### For Dashboard Design

1. **Clear Visual Hierarchy** - Important metrics first
2. **Consistent Layout** - Use same patterns across pages
3. **Quick Actions** - Common tasks accessible
4. **Error Handling** - Graceful failure states
5. **Loading States** - Skeleton loaders

### For Data Display

1. **Pagination** - Don't show all data at once
2. **Sorting** - Allow column sorting
3. **Filtering** - Enable data filtering
4. **Search** - Global search functionality
5. **Export** - Allow data export

### For Security

1. **Role-Based Access** - Enforce permissions
2. **Audit Logging** - Track all actions
3. **Session Management** - Timeout inactive sessions
4. **Input Validation** - Validate all inputs
5. **Rate Limiting** - Prevent abuse

## Troubleshooting

### Issue: Dashboard not loading

**Cause:** User not authenticated or insufficient permissions

**Solution:**
```typescript
// Check user role
const session = await getSession();
console.log('User role:', session?.role);

// Ensure role is ADMIN or SUPER_ADMIN
```

### Issue: Analytics not showing

**Cause:** No data or date range issue

**Solution:**
```sql
-- Check if activity logs exist
SELECT COUNT(*) FROM activity_logs;

-- Check date range
SELECT * FROM activity_logs
WHERE createdAt >= NOW() - INTERVAL '7 days';
```

### Issue: Can't ban user

**Cause:** Insufficient permissions (need SUPER_ADMIN)

**Solution:** Ensure user has SUPER_ADMIN role

## Performance Optimization

### Database Indexes

```sql
-- Speed up user queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(isActive);

-- Speed up book queries
CREATE INDEX idx_books_public ON books(isPublic);
CREATE INDEX idx_books_type ON books(type);

-- Speed up analytics
CREATE INDEX idx_activity_logs_created ON activity_logs(createdAt);
```

### Caching Strategy

```typescript
// Cache dashboard metrics
const cacheKey = `admin:analytics:overview:${period}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await fetchAnalytics(period);
await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min cache
```

## Future Enhancements

- [ ] Real-time updates with WebSocket
- [ ] Custom report builder
- [ ] Automated reports via email
- [ ] Advanced filtering
- [ ] Bulk actions
- [ ] Role management UI
- [ ] Two-factor authentication
- [ ] Activity timeline

## See Also

- [AUTH_README.md](AUTH_README.md) - Authentication system
- [MARKETPLACE.md](MARKETPLACE.md) - Marketplace moderation
- [SETUP.md](SETUP.md) - Environment setup
