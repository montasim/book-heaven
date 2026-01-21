# Quiz & Gamification System

## Overview

Book Heaven features an engaging quiz and gamification system that encourages reading comprehension and user engagement. Users can take auto-generated quizzes on books they've read, compete on leaderboards, maintain daily streaks, and unlock achievements.

## Features

- **Auto-Generated Questions** - 20 AI-generated questions per book
- **Daily Streaks** - Track consecutive days of quiz wins
- **Leaderboards** - Compete with other readers
- **Achievement System** - Unlock badges across 6 tiers
- **XP Rewards** - Earn experience points
- **Difficulty Levels** - Easy, medium, hard options

## Architecture

### Quiz Flow

```
User selects book → Generates 20 questions → User answers quiz
                                            ↓
                                    Calculate score
                                            ↓
                            Update streak & achievements
                                            ↓
                                    Update leaderboard
```

### Achievement System

```
User Action → Check Achievement Criteria → Unlock Achievement
                                              ↓
                                      Award XP
                                              ↓
                                    Show notification
```

## Database Models

### BookQuestion
Auto-generated quiz questions:

```prisma
model BookQuestion {
  id           String   @id @default(uuid())
  bookId       String
  question     String   // The question text
  answer       String   // The answer text
  order        Int      // Display order (1-20)
  isAIGenerated Boolean @default(true)

  book         Book     @relation(fields: [bookId])

  @@index([bookId, order])
}
```

### QuizAttempt
User quiz attempts:

```prisma
model QuizAttempt {
  id                  String   @id @default(uuid())
  userId              String
  category            String
  difficulty          String   // 'easy', 'medium', 'hard'
  questionCount       Int
  score               Int      // Number correct
  totalQuestions      Int
  accuracy            Float    // Percentage (0-100)
  timeTaken           Int?     // Seconds
  quizStreak          Int      // Max consecutive correct
  dailyStreakAtTime   Int      // Daily streak when completed
  combinedScore       Int      // For leaderboard
  createdAt           DateTime @default(now())

  user                User     @relation(fields: [userId])

  @@index([userId])
  @@index([combinedScore(sort: Desc)])
}
```

### QuizStreak
User streak tracking:

```prisma
model QuizStreak {
  id                String   @id @default(uuid())
  userId            String   @unique
  currentDailyStreak Int    @default(0)
  bestDailyStreak    Int     @default(0)
  lastQuizDate       DateTime?
  bestQuizStreak     Int     @default(0)
  totalQuizzes       Int     @default(0)
  totalWins          Int     @default(0)   // Score ≥ 50%
  totalCorrect       Int     @default(0)
  totalQuestions     Int     @default(0)

  user               User    @relation(fields: [userId])
}
```

### Achievement
Achievement definitions:

```prisma
model Achievement {
  id           String              @id @default(uuid())
  code         String              @unique  // 'FIRST_BOOK', 'READER_10'
  name         String
  description  String              @db.Text
  icon         String?             // Emoji or icon name
  category     AchievementCategory
  tier         AchievementTier     @default(BRONZE)
  xp           Int                 @default(0)
  requirements Json                // { type: 'BOOKS_READ', count: 10 }
  unlockCount  Int                 @default(0)
  isVisible    Boolean             @default(true)

  userAchievements UserAchievement[]
}

enum AchievementCategory {
  READING
  COLLECTION
  QUIZ
  MARKETPLACE
  SOCIAL
  ENGAGEMENT
  SPECIAL
}

enum AchievementTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
  DIAMOND
  LEGENDARY
}
```

### UserAchievement
Unlocked achievements:

```prisma
model UserAchievement {
  id            String      @id @default(uuid())
  userId        String
  achievementId String
  unlockedAt    DateTime    @default(now())
  progress      Int         @default(0)
  maxProgress   Int         @default(1)

  user          User        @relation(fields: [userId])
  achievement   Achievement @relation(fields: [achievementId])

  @@unique([userId, achievementId])
}
```

## API Endpoints

### Quiz

#### GET /api/books/[id]/questions
Get quiz questions for a book.

**Query Parameters:**
- `count`: Number of questions (default: 20)
- `difficulty`: Filter by difficulty

**Response:**
```json
{
  "questions": [
    {
      "id": "q-uuid",
      "question": "What is the main theme of the book?",
      "order": 1
    }
  ]
}
```

#### POST /api/books/[id]/quiz/submit
Submit quiz answers.

**Request:**
```json
{
  "answers": [
    { "questionId": "q-uuid-1", "answer": "The theme is..." },
    { "questionId": "q-uuid-2", "answer": "Character growth" }
  ],
  "difficulty": "medium",
  "timeTaken": 300
}
```

**Response:**
```json
{
  "score": 8,
  "totalQuestions": 10,
  "accuracy": 80.0,
  "quizStreak": 5,
  "dailyStreak": 12,
  "combinedScore": 1500,
  "achievementsUnlocked": [
    {
      "code": "QUIZ_MASTER",
      "name": "Quiz Master",
      "tier": "GOLD",
      "xp": 100
    }
  ],
  "correctAnswers": [
    { "questionId": "q-uuid-1", "correctAnswer": "The theme is love" }
  ]
}
```

#### POST /api/books/[id]/questions/regenerate
Regenerate questions for a book (admin only).

### Leaderboard

#### GET /api/quiz/leaderboard
Get top quiz performers.

**Query Parameters:**
- `period`: 'all' | 'week' | 'month'
- `limit`: Number of entries (default: 50)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user": {
        "id": "user-uuid",
        "name": "Jane Doe",
        "avatar": "avatar-url"
      },
      "score": 2500,
      "quizzesWon": 45,
      "accuracy": 85.5
    }
  ],
  "currentUser": {
    "rank": 23,
    "score": 1200
  }
}
```

### Achievements

#### GET /api/achievements
Get all achievements.

**Query Parameters:**
- `category`: Filter by category
- `tier`: Filter by tier

**Response:**
```json
{
  "achievements": [
    {
      "id": "ach-uuid",
      "code": "FIRST_BOOK",
      "name": "Bookworm",
      "description": "Complete your first book",
      "icon": "📚",
      "category": "READING",
      "tier": "BRONZE",
      "xp": 50,
      "requirements": { "type": "BOOKS_READ", "count": 1 },
      "isUnlocked": true,
      "unlockedAt": "2024-01-15T10:00:00Z",
      "progress": 1,
      "maxProgress": 1
    }
  ]
}
```

#### GET /api/user/achievements
Get user's achievements.

#### POST /api/admin/achievements/seed
Seed initial achievements (admin only).

### Streaks

#### GET /api/user/streak
Get user's current streak.

**Response:**
```json
{
  "currentDailyStreak": 12,
  "bestDailyStreak": 30,
  "lastQuizDate": "2024-01-21T10:00:00Z",
  "bestQuizStreak": 8,
  "totalQuizzes": 150,
  "totalWins": 120,
  "totalCorrect": 480,
  "totalQuestions": 600
}
```

## Achievement Types

### Reading Achievements

| Code | Name | Tier | Requirement | XP |
|------|------|------|-------------|-----|
| FIRST_BOOK | Bookworm | BRONZE | Complete 1 book | 50 |
| READER_10 | Avid Reader | SILVER | Complete 10 books | 150 |
| READER_50 | Book Enthusiast | GOLD | Complete 50 books | 500 |
| READER_100 | Bibliophile | PLATINUM | Complete 100 books | 1000 |

### Quiz Achievements

| Code | Name | Tier | Requirement | XP |
|------|------|------|-------------|-----|
| FIRST_QUIZ | Quiz Novice | BRONZE | Complete 1 quiz | 25 |
| PERFECT_SCORE | Perfectionist | GOLD | Get 100% on quiz | 200 |
| STREAK_7 | Week Warrior | SILVER | 7-day streak | 300 |
| STREAK_30 | Monthly Master | PLATINUM | 30-day streak | 1000 |

### Collection Achievements

| Code | Name | Tier | Requirement | XP |
|------|------|------|-------------|-----|
| FIRST_BOOKSHELF | Organizer | BRONZE | Create 1 bookshelf | 50 |
| COLLECTOR_100 | Collector | GOLD | Add 100 books | 500 |

## Question Generation

### AI-Powered Generation

Questions are auto-generated using AI:

```typescript
// src/lib/ai/questions.ts
async function generateQuestions(bookId: string) {
  const book = await getBook(bookId);

  // Extract key topics and themes
  const overview = book.aiOverview;
  const summary = book.aiSummary;

  // Generate questions using AI
  const prompt = `
    Generate 20 quiz questions based on this book:
    Title: ${book.name}
    Summary: ${summary}
    Overview: ${overview}

    Requirements:
    - Mix of easy, medium, and hard questions
    - Questions should test comprehension
    - Include questions about themes, characters, and plot
    - Provide detailed answers
  `;

  const questions = await ai.generate(prompt);

  // Save to database
  await saveQuestions(bookId, questions);

  return questions;
}
```

### Question Types

1. **Factual** - Specific details from the book
2. **Thematic** - Understanding themes and messages
3. **Character** - Character motivations and development
4. **Plot** - Sequence of events
5. **Inference** - Drawing conclusions

## Scoring System

### Score Calculation

```typescript
function calculateQuizScore(
  correctAnswers: number,
  totalQuestions: number,
  quizStreak: number,
  dailyStreak: number,
  timeTaken?: number
): number {
  // Base score: 100 points per correct answer
  let score = correctAnswers * 100;

  // Streak bonus: 50 points per consecutive correct
  score += quizStreak * 50;

  // Daily streak bonus: 25 points per day
  score += dailyStreak * 25;

  // Time bonus (if completed quickly)
  if (timeTaken && timeTaken < 300) { // Less than 5 minutes
    score += 100;
  }

  return score;
}
```

### Accuracy Calculation

```typescript
const accuracy = (correctAnswers / totalQuestions) * 100;

// Win threshold: 50% or higher
const isWin = accuracy >= 50;
```

### Leaderboard Ranking

Users are ranked by:
1. **Combined Score** (primary)
2. **Total Wins** (secondary)
3. **Average Accuracy** (tertiary)

## Frontend Integration

### Taking a Quiz

```typescript
async function startQuiz(bookId: string) {
  const response = await fetch(`/api/books/${bookId}/questions?count=20`);
  const { questions } = await response.json();

  // Display questions one by one
  questions.forEach((q, index) => {
    showQuestion(q, index);
  });
}

async function submitQuiz(bookId: string, answers: QuizAnswer[]) {
  const response = await fetch(`/api/books/${bookId}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers,
      difficulty: 'medium',
      timeTaken: elapsedTime
    })
  });

  const result = await response.json();

  // Show results
  showQuizResults(result);

  // Check for new achievements
  if (result.achievementsUnlocked.length > 0) {
    showAchievementNotifications(result.achievementsUnlocked);
  }
}
```

### Displaying Leaderboard

```typescript
async function fetchLeaderboard(period: 'week' | 'month' | 'all') {
  const response = await fetch(`/api/quiz/leaderboard?period=${period}&limit=50`);
  const { leaderboard, currentUser } = await response.json();

  // Render leaderboard
  renderLeaderboard(leaderboard);

  // Highlight user's position
  highlightCurrentUser(currentUser);
}
```

### Achievement Tracking

```typescript
// Listen for achievement unlocks
socket.on('achievement_unlocked', (achievement) => {
  showAchievementToast(achievement);
});

// View all achievements
async function viewAchievements() {
  const response = await fetch('/api/user/achievements');
  const { achievements } = await response.json();

  renderAchievements(achievements);
}
```

## Configuration

### Environment Variables

None required (uses existing AI configuration)

### Quiz Settings

```typescript
const QUIZ_CONFIG = {
  defaultQuestionCount: 20,
  minQuestionCount: 5,
  maxQuestionCount: 50,
  winThreshold: 50,        // 50% to count as win
  streakResetHours: 48,    // Reset streak if no quiz in 48 hours
  easyQuestions: 5,
  mediumQuestions: 10,
  hardQuestions: 5
};
```

## Best Practices

### For Question Generation

1. **Quality Control** - Review AI-generated questions
2. **Variety** - Ensure mix of question types
3. **Accuracy** - Verify answers are correct
4. **Difficulty Balance** - Provide range of difficulties

### For User Engagement

1. **Daily Reminders** - Encourage maintaining streaks
2. **Achievement Progress** - Show progress towards next achievement
3. **Leaderboard Updates** - Real-time position changes
4. **Social Sharing** - Allow sharing quiz results

## Troubleshooting

### Issue: Questions not generated

**Cause:** AI service unavailable or content not extracted

**Solution:**
```bash
# Check book processing status
SELECT name, questionsStatus, processingStatus
FROM books
WHERE id = 'book-uuid';

# Regenerate questions
POST /api/admin/books/[id]/regenerate-questions
```

### Issue: Streak not updating

**Cause:** Quiz score below win threshold (50%)

**Solution:** Ensure accuracy is ≥ 50% to maintain streak

### Issue: Achievement not unlocking

**Cause:** Requirements not met or achievement code incorrect

**Solution:**
```bash
# Check user progress
SELECT * FROM user_achievements
WHERE userId = 'user-uuid' AND achievementId = 'ach-uuid';

# View achievement requirements
SELECT * FROM achievements WHERE code = 'ACHIEVEMENT_CODE';
```

## Future Enhancements

- [ ] Multiplayer quiz battles
- [ ] Custom question creation
- [ ] Question rating system
- [ ] Adaptive difficulty
- [ ] Quiz categories by genre
- [ ] Tournament mode
- [ ] Team quizzes
- [ ] Time trial mode

## See Also

- [AI_CHAT.md](AI_CHAT.md) - AI integration details
- [BOOK_CONTENT_EXTRACTION.md](BOOK_CONTENT_EXTRACTION.md) - Content processing
