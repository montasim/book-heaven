# Book Suggestions Feature Implementation Plan

## Overview
Add relevant book suggestions to the book detail page (`/books/[id]`) based on the current book's authors, publications, and categories.

## Current State Analysis

### Existing Related Books Logic
- Location: `/api/public/books/[id]/route.ts`
- Current matching criteria: Shared categories OR shared authors
- Sorts by: Reading progress count (popularity)
- Limit: 6 books
- **Issue**: Not displayed in UI, publications not considered

### Book Detail Page Structure
- Location: `src/app/(public)/books/[id]/page.tsx`
- Current tabs: Description, Progress
- No related books section visible to users

---

## Implementation Plan

### Phase 1: Enhance Recommendation Algorithm (API)

**File: `src/app/api/public/books/[id]/route.ts`**

#### 1.1 Improve Related Books Query Logic

**Current Logic:**
```typescript
// Matches categories OR authors, sorts by popularity
OR: [
  { categories: { some: { categoryId: { in: bookCategories } } } },
  { authors: { some: { authorId: { in: bookAuthors } } } }
]
```

**Enhanced Logic (Weighted Scoring):**
```typescript
// Priority 1: Same author (highest weight)
// Priority 2: Same publication (medium weight)
// Priority 3: Same categories (lower weight)
// Sort by: Relevance score, then popularity
```

#### 1.2 Implementation Approach

**Option A: Database-Level Scoring (Recommended)**
- Use multiple queries with different priorities
- Union results with ranking
- More performant for large datasets

**Option B: Application-Level Scoring**
- Fetch candidates for each criteria
- Score and sort in JavaScript
- More flexible for tweaking weights

**Recommended: Option A** - Better performance and scalability

#### 1.3 Algorithm Details

```
Score Calculation:
- Same author: +3 points per matching author
- Same publication: +2 points per matching publication
- Same category: +1 point per matching category

Bonus modifiers:
- +1 point if book has high rating (4+ stars)
- +0.5 points if recently added (within 30 days)
- +0.5 points if popular (high progress count)

Final sort: Score DESC, then readingProgress._count DESC
```

#### 1.4 Fetch Strategy
```typescript
// Fetch in order of priority
const authorMatches = await prisma.book.findMany({
  where: {
    id: { not: currentBookId },
    authors: { some: { authorId: { in: currentBookAuthorIds } } }
  },
  take: 10
});

const publicationMatches = await prisma.book.findMany({
  where: {
    id: { not: currentBookId, notIn: fetchedIds },
    publications: { some: { publicationId: { in: currentBookPublicationIds } } }
  },
  take: 10
});

const categoryMatches = await prisma.book.findMany({
  where: {
    id: { not: currentBookId, notIn: fetchedIds },
    categories: { some: { categoryId: { in: currentBookCategoryIds } } }
  },
  take: 10
});

// Combine, deduplicate, score, and sort
```

---

### Phase 2: Create Suggestions UI Components

#### 2.1 Create `book-suggestions.tsx` Component

**Location: `src/components/books/book-suggestions.tsx`**

```typescript
interface BookSuggestionsProps {
  books: Book[]
  currentBookId: string
  reasons?: Record<string, string> // Book ID -> reason text
}

Features:
- Horizontal scroll/grid layout
- "Why recommended" badges ("Same author", "Same publisher", etc.)
- Compact book cards
- View all related books button
- Empty state when no suggestions
```

**Visual Design:**
- Section header: "You might also like"
- Subsection headers by reason:
  - "More by [Author Name]"
  - "More from [Publication Name]"
  - "Similar in [Category Name]"
- Responsive: 2-4 columns on desktop, 1-2 on mobile
- Smooth scroll interactions

#### 2.2 Create `recommendation-badge.tsx` Component

**Location: `src/components/books/recommendation-badge.tsx`**

```typescript
interface RecommendationBadgeProps {
  type: 'author' | 'publication' | 'category'
  name: string
}

// Visual indicator showing why a book is recommended
```

---

### Phase 3: Integrate into Book Detail Page

#### 3.1 Add "Related Books" Tab

**File: `src/app/(public)/books/[id]/page.tsx`**

```typescript
// Add to existing tabs array
const tabs = [
  { value: 'description', label: 'Description' },
  { value: 'progress', label: 'Progress' },
  { value: 'related', label: 'Related Books' } // NEW
]
```

#### 3.2 Add Tab Content

```tsx
{tab === 'related' && (
  <BookSuggestions
    books={book.relatedBooks || []}
    currentBookId={book.id}
    reasons={recommendationReasons}
  />
)}
```

#### 3.3 Alternative: Show as Section Below Tabs

Place suggestions section below the tabbed content as a always-visible section instead of a tab.

---

### Phase 4: Add Recommendation Reasons Display

#### 4.1 Extend API Response

**File: `src/app/api/public/books/[id]/route.ts`**

```typescript
// Add to response
interface BookWithRecommendations extends Book {
  relatedBooks: Book[]
  recommendationReasons: {
    [bookId: string]: {
      authors?: string[]
      publications?: string[]
      categories?: string[]
      score: number
    }
  }
}
```

#### 4.2 Generate Reason Text

```typescript
// In API or component
function getReasonText(reasons: RecommendationReason): string {
  if (reasons.authors?.length) {
    return `More by ${reasons.authors[0]}`
  }
  if (reasons.publications?.length) {
    return `From ${reasons.publications[0]}`
  }
  return `Similar in ${reasons.categories?.[0]}`
}
```

---

### Phase 5: Enhanced Filtering Options

#### 5.1 Add Filters to Suggestions

```typescript
interface SuggestionFilters {
  showAuthorsOnly: boolean
  showPublicationsOnly: boolean
  showCategoriesOnly: boolean
  type?: BookType
}
```

#### 5.2 "View More" Functionality

- Link to filtered book listing page
- Pre-fill filters based on current book's authors/publications/categories
- Example: `/books?author=xyz&category=abc`

---

## Implementation Steps

### Step 1: Backend API Enhancement
- [ ] Update `/api/public/books/[id]/route.ts` with improved algorithm
- [ ] Add publication matching to related books query
- [ ] Implement weighted scoring system
- [ ] Add recommendation reasons to response
- [ ] Test with various book combinations

### Step 2: Create UI Components
- [ ] Create `book-suggestions.tsx` component
- [ ] Create `recommendation-badge.tsx` component
- [ ] Add responsive styles
- [ ] Implement empty state

### Step 3: Integrate into Detail Page
- [ ] Add "Related Books" tab to book detail page
- [ ] Or add as section below tabs (decide based on UX preference)
- [ ] Connect API data to components
- [ ] Add loading states

### Step 4: Enhance Navigation
- [ ] Add "View more books by [author]" links
- [ ] Add "View more from [publisher]" links
- [ ] Update book listing page to handle pre-filled filters

### Step 5: Polish & Test
- [ ] Test with books that have no suggestions
- [ ] Test with books that have many suggestions
- [ ] Test with premium content access
- [ ] Performance testing
- [ ] Mobile responsiveness testing

---

## Technical Considerations

### Performance
- **Query optimization**: Use `select` instead of `include` where possible
- **Pagination**: Limit to 6-12 suggestions, load more on demand
- **Caching**: Cache related books for 5-10 minutes
- **Database indexes**: Ensure junction tables are indexed

### Edge Cases
- **Book with no authors/publications/categories**: Show random popular books
- **No matches found**: Show "No similar books found" message
- **Current book in results**: Filter out via `id: { not: currentBookId }`
- **Premium books**: Respect user's premium access level

### Accessibility
- Keyboard navigation for horizontal scroll
- ARIA labels for recommendation reasons
- Alt text for book covers
- Focus management

---

## Files to Modify

### Backend
1. `src/app/api/public/books/[id]/route.ts` - Enhanced recommendation logic

### Frontend
2. `src/app/(public)/books/[id]/page.tsx` - Add suggestions section/tab
3. `src/components/books/book-suggestions.tsx` - NEW component
4. `src/components/books/recommendation-badge.tsx` - NEW component

### Types
5. `src/types/book.ts` - Add recommendation reason types

---

## Success Metrics

- Users who view related books: X% increase in book discovery
- Click-through rate on suggested books: Target Y%
- Reduction in zero-result searches
- Increased bookshelf additions from suggestions

---

## Future Enhancements

1. **Collaborative Filtering**: "Users who read this also read..."
2. **Content-Based Similarity**: Compare book summaries using embeddings
3. **Personalization**: User's reading history influences suggestions
4. **Popularity Decay**: Boost recent trending books
5. **Ratings System**: Incorporate user ratings into scoring
