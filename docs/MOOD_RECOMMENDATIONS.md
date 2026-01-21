# Mood-Based Book Recommendations

## Overview

Book Heaven features an intelligent mood-based recommendation system that suggests books based on how users are feeling. The system maps moods to book categories and provides personalized recommendations powered by AI.

## Features

- **Interactive Mood Selection** - Visual mood picker with emojis
- **AI-Powered Suggestions** - Context-aware recommendations
- **Category Mapping** - Moods mapped to relevant book categories
- **Personalized** - Considers user's reading history
- **Responsive UI** - Beautiful modal interface

## Architecture

### Recommendation Flow

```
User selects mood → Get mapped categories → Fetch books
                                              ↓
                            AI ranks by relevance
                                              ↓
                              Display recommendations
```

### Components

1. **Mood Picker** - Visual mood selection interface
2. **Category Mapper** - Maps moods to book categories
3. **AI Ranker** - Ranks books by relevance
4. **Personalization** - Adjusts based on user history

## Database Models

### Mood
Mood configuration:

```prisma
model Mood {
  id           String   @id @default(uuid())
  identifier   String   @unique  // 'happy', 'adventurous'
  name         String   // Display name: 'Happy'
  emoji        String   // '😊'
  description  String   // 'Feel-good stories...'
  color        String   // CSS classes
  isActive     Boolean  @default(true)
  order        Int      @default(0)

  mappings     MoodCategoryMapping[]
}
```

### MoodCategoryMapping
Many-to-many mapping:

```prisma
model MoodCategoryMapping {
  id         String   @id @default(uuid())
  moodId     String
  categoryId String

  mood       Mood     @relation(fields: [moodId])
  category   Category @relation(fields: [categoryId])

  @@unique([moodId, categoryId])
}
```

## Default Moods

| Identifier | Name | Emoji | Description | Categories |
|------------|------|-------|-------------|------------|
| happy | Happy | 😊 | Feel-good stories | Romance, Comedy, Inspirational |
| adventurous | Adventurous | 🚀 | Exciting journeys | Adventure, Fantasy, Sci-Fi |
| thoughtful | Thoughtful | 🤔 | Deep thinking | Philosophy, Psychology, Science |
| relaxed | Relaxed | 😌 | Easy reading | Poetry, Short Stories, Memoirs |
| mysterious | Mysterious | 🔮 | Uncover secrets | Mystery, Thriller, Horror |
| romantic | Romantic | 💕 | Love stories | Romance, Drama, Historical Fiction |
| melancholic | Melancholic | 😢 | Reflective | Drama, Tragedy, Literary Fiction |
| motivated | Motivated | 💪 | Achieve goals | Self-Help, Business, Biography |

## API Endpoints

### GET /api/moods
Get all active moods.

**Response:**
```json
{
  "moods": [
    {
      "id": "mood-uuid",
      "identifier": "happy",
      "name": "Happy",
      "emoji": "😊",
      "description": "Feel-good stories that will brighten your day",
      "color": "bg-yellow-100 text-yellow-800",
      "order": 1
    }
  ]
}
```

### GET /api/moods/[identifier]/recommendations
Get book recommendations for a mood.

**Query Parameters:**
- `limit`: Number of books (default: 12)
- `page`: Page number (default: 1)

**Response:**
```json
{
  "mood": {
    "identifier": "happy",
    "name": "Happy",
    "emoji": "😊"
  },
  "categories": ["Romance", "Comedy", "Inspirational"],
  "books": [
    {
      "id": "book-uuid",
      "name": "Book Title",
      "image": "image-url",
      "authors": ["Author Name"],
      "rating": 4.5,
      "relevanceScore": 0.95
    }
  ],
  "total": 45,
  "page": 1
}
```

### POST /api/moods/seed
Seed default moods (admin only).

## Frontend Integration

### Mood Picker Component

```typescript
// src/components/mood/MoodPicker.tsx
interface Mood {
  id: string;
  identifier: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

function MoodPicker() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/moods')
      .then(res => res.json())
      .then(data => setMoods(data.moods));
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {moods.map(mood => (
        <button
          key={mood.id}
          onClick={() => setSelectedMood(mood.identifier)}
          className={`
            p-6 rounded-xl transition-all
            ${mood.color}
            ${selectedMood === mood.identifier ? 'ring-4 ring-offset-2' : ''}
          `}
        >
          <span className="text-4xl">{mood.emoji}</span>
          <h3 className="mt-2 font-semibold">{mood.name}</h3>
          <p className="text-sm opacity-75">{mood.description}</p>
        </button>
      ))}
    </div>
  );
}
```

### Recommendations Display

```typescript
// src/components/mood/RecommendationsModal.tsx
interface RecommendationsModalProps {
  mood: string;
  onClose: () => void;
}

function RecommendationsModal({ mood, onClose }: RecommendationsModalProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/moods/${mood}/recommendations?limit=12`)
      .then(res => res.json())
      .then(data => {
        setBooks(data.books);
        setLoading(false);
      });
  }, [mood]);

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          Books for when you're feeling {mood}
        </h2>

        {loading ? (
          <Skeleton count={12} />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
```

### AI Ranking Algorithm

```typescript
// src/lib/recommendations/ranker.ts
interface RankingFactors {
  relevanceScore: number;    // Category match
  userHistory: number;        // Past reads in category
  popularity: number;         // Overall views/rating
  rating: number;             // User ratings
}

async function rankBooks(
  books: Book[],
  mood: string,
  userId?: string
): Promise<Book[]> {
  const rankedBooks = await Promise.all(
    books.map(async (book) => {
      const factors: RankingFactors = {
        // 1. Category relevance (40%)
        relevanceScore: calculateCategoryMatch(book, mood),

        // 2. User history (25%)
        userHistory: userId
          ? await calculateHistoryScore(book.id, userId)
          : 0.5,

        // 3. Popularity (20%)
        popularity: await calculatePopularity(book.id),

        // 4. Rating (15%)
        rating: book.rating || 0.5
      };

      // Weighted score
      const score =
        factors.relevanceScore * 0.40 +
        factors.userHistory * 0.25 +
        factors.popularity * 0.20 +
        factors.rating * 0.15;

      return { ...book, relevanceScore: score };
    })
  );

  // Sort by score (highest first)
  return rankedBooks.sort((a, b) =>
    b.relevanceScore - a.relevanceScore
  );
}
```

## Configuration

### Mood Settings

```typescript
const MOOD_CONFIG = {
  defaultLimit: 12,        // Books per mood
  maxLimit: 50,            // Maximum books
  minBooksPerCategory: 2,  // Minimum from each category
  personalized: true,       // Use user history
  cacheDuration: 3600       // Cache for 1 hour
};
```

### Category Weights

```typescript
const CATEGORY_WEIGHTS: Record<string, number> = {
  // Happy mood
  Romance: 1.0,
  Comedy: 1.0,
  Inspirational: 0.9,
  Adventure: 0.7,

  // Mysterious mood
  Mystery: 1.0,
  Thriller: 1.0,
  Horror: 0.9,
  Suspense: 0.8,

  // Add more mappings...
};
```

## Seeding Default Moods

```bash
# Seed default moods
curl -X POST http://localhost:3000/api/moods/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "moodsCreated": 8,
  "mappingsCreated": 32
}
```

## User Preferences

### Enabling/Disabling Recommendations

Users can control mood recommendations in settings:

```typescript
// User preference
interface UserPreferences {
  showMoodRecommendations: boolean;
  preferredMoods?: string[];  // Favorite moods
}

// Update preference
async function updateMoodPreference(enabled: boolean) {
  await fetch('/api/user/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      showMoodRecommendations: enabled
    })
  });
}
```

## Personalization

### History-Based Ranking

```typescript
// Calculate history score for a book
async function calculateHistoryScore(
  bookId: string,
  userId: string
): Promise<number> {
  // Get user's reading history
  const history = await getUserReadingHistory(userId);

  // Count books in same categories
  const book = await getBook(bookId);
  const categoryMatch = history.filter(h =>
    h.categories.some(c => book.categories.includes(c))
  ).length;

  // Normalize score (0-1)
  return Math.min(categoryMatch / 10, 1);
}
```

### Favorite Moods

Users can mark favorite moods for quick access:

```typescript
// Get favorite moods
const response = await fetch('/api/user/favorite-moods');
const { moods } = await response.json();

// Display favorites prominently
return (
  <div>
    <h3>Your Favorite Moods</h3>
    {moods.map(mood => (
      <MoodButton key={mood.id} mood={mood} />
    ))}
  </div>
);
```

## Analytics

### Tracking Mood Selections

Track which moods are most popular:

```prisma
model MoodSelection {
  id          String   @id @default(uuid())
  moodId      String
  userId      String?
  selectedAt  DateTime @default(now())

  mood        Mood     @relation(fields: [moodId])

  @@index([moodId, selectedAt])
}
```

### Popular Moods Dashboard

```typescript
// GET /api/admin/moods/analytics
{
  "topMoods": [
    { "identifier": "happy", "selections": 1250 },
    { "identifier": "adventurous", "selections": 980 }
  ],
  "trends": [
    { "date": "2024-01-21", "moods": { "happy": 45, "sad": 12 } }
  ]
}
```

## Best Practices

### For Mood Selection UI

1. **Visual Feedback** - Show emoji and colors clearly
2. **Accessibility** - Use aria-labels for screen readers
3. **Quick Loading** - Cache mood data
4. **Clear CTAs** - Obvious next steps

### For Recommendations

1. **Quality Over Quantity** - Show best matches, not all
2. **Variety** - Mix popular and hidden gems
3. **Fresh Content** - Rotate recommendations periodically
4. **Transparency** - Show why books were recommended

## Troubleshooting

### Issue: No books for mood

**Cause:** No categories mapped or no books in categories

**Solution:**
```sql
-- Check mappings
SELECT * FROM mood_category_mappings WHERE moodId = 'mood-uuid';

-- Check book counts
SELECT c.name, COUNT(b.id)
FROM categories c
LEFT JOIN book_categories bc ON c.id = bc.categoryId
LEFT JOIN books b ON bc.bookId = b.id
WHERE c.id IN (
  SELECT categoryId FROM mood_category_mappings WHERE moodId = 'mood-uuid'
)
GROUP BY c.id;
```

### Issue: Recommendations not personalized

**Cause:** User not logged in or no reading history

**Solution:** Ensure user is authenticated and has read some books

### Issue: Mood not showing

**Cause:** Mood marked inactive or order issue

**Solution:**
```sql
-- Check mood status
SELECT * FROM moods WHERE identifier = 'mood-name';

-- Update to active
UPDATE moods SET isActive = true WHERE identifier = 'mood-name';
```

## Future Enhancements

- [ ] Time-based moods (morning, evening)
- [ ] Weather-based suggestions
- [ ] Seasonal recommendations
- [ ] Mood combinations
- [ ] Social mood sharing
- [ ] Mood tracking history
- [ ] AI-generated mood descriptions

## See Also

- [AI_CHAT.md](AI_CHAT.md) - AI integration
- [SETUP.md](SETUP.md) - Environment setup
