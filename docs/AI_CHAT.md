# AI-Powered Book Chat

## Overview

Book Heaven features an intelligent AI-powered chat system that allows users to have natural, context-aware conversations about books. The system uses RAG (Retrieval-Augmented Generation) to provide accurate, book-specific responses.

## Features

- **Context-Aware Conversations** - AI understands the book's content and context
- **Dual AI Provider** - Automatic fallback between Zhipu AI and Gemini
- **Semantic Search** - Vector embeddings for relevant content retrieval
- **Conversation History** - Persistent chat sessions per book
- **Real-Time Streaming** - Streaming responses for better UX

## Architecture

### RAG Pipeline

```
User Query
    ↓
Query Embedding (Gemini text-embedding-004)
    ↓
Vector Search (Find relevant chunks)
    ↓
Context Retrieval (Top 5 chunks)
    ↓
AI Generation (Zhipu glm-4.7 or Gemini)
    ↓
Streaming Response
```

### Components

1. **Content Extraction** - PDF text extraction and chunking
2. **Vector Embeddings** - Convert chunks to 768-dim vectors
3. **Semantic Search** - Find relevant content chunks
4. **Context Assembly** - Combine chunks for AI context
5. **Response Generation** - AI generates contextual response

## Database Models

### BookChatMessage
Stores conversation history:

```prisma
model BookChatMessage {
  id           String   @id
  bookId       String
  userId       String
  sessionId    String   // Groups messages into conversations
  role         String   // 'user' or 'assistant'
  content      String   @db.Text
  createdAt    DateTime
  messageIndex Int      // Order within session
}
```

### BookChatContext
Stores content chunks for retrieval:

```prisma
model BookChatContext {
  id          String   @id
  bookId      String
  chunkIndex  Int      // Which chunk of the book
  content     String   @db.Text
  pageNumber  Int?
  wordCount   Int?
}
```

## API Endpoints

### POST /api/books/[id]/chat

Send a message to the AI chat.

**Request:**
```json
{
  "message": "What is the main theme of this book?",
  "sessionId": "optional-session-id-or-null"
}
```

**Response (Streaming):**
```
data: {"type":"token","content":"The"}
data: {"type":"token","content":" main"}
data: {"type":"token","content":" theme"}
...
data: {"type":"done","sessionId":"uuid-here"}
```

### GET /api/books/[id]/chat/sessions

Get all chat sessions for a book.

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "title": "About the main character...",
      "messageCount": 5,
      "lastMessageAt": "2024-01-21T10:30:00Z"
    }
  ]
}
```

## Implementation Details

### Dual AI Provider Setup

The system uses two AI providers for reliability:

#### Primary: Zhipu AI (glm-4.7)
- High-quality responses
- Cost-effective (~$0.60 per million tokens)
- Fast response times

#### Fallback: Gemini AI
- Activates automatically when Zhipu quota exceeded
- Ensures service availability
- Free tier available

**Code Example:**
```typescript
// src/lib/ai/chat.ts
async function generateChat(message: string, context: string) {
  try {
    // Try Zhipu AI first
    return await zhipuAI.chat(message, context);
  } catch (error) {
    if (error.isQuotaExceeded) {
      // Fallback to Gemini
      return await geminiAI.chat(message, context);
    }
    throw error;
  }
}
```

### Vector Embeddings

For semantic search, the system uses:
- **Model:** Gemini text-embedding-004
- **Dimensions:** 768
- **Chunk Size:** ~500 words
- **Overlap:** 50 words between chunks

**Embedding Storage:**
- Primary database: BookChatContext model (for metadata)
- Vector database: Separate PostgreSQL with pgvector (for similarity search)

### Content Processing Pipeline

When a book is uploaded:

1. **PDF Download** - Download from Google Drive
2. **Text Extraction** - Extract full text content
3. **Content Chunking** - Split into ~500 word chunks
4. **Embedding Generation** - Convert each chunk to vector
5. **Vector Storage** - Store in pgvector database
6. **Status Update** - Mark book as ready for chat

**Status Tracking:**
```typescript
interface ProcessingStatus {
  extractionStatus: 'pending' | 'completed' | 'failed'
  embeddingStatus: 'pending' | 'completed' | 'failed'
  contentExtractedAt?: Date
  contentWordCount?: number
}
```

## Usage Example

### Frontend Integration

```typescript
// Chat with a book
async function chatWithBook(bookId: string, message: string) {
  const response = await fetch(`/api/books/${bookId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId: null })
  });

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'token') {
          // Append token to UI
          appendMessage(data.content);
        }
      }
    }
  }
}
```

## Configuration

### Environment Variables

```env
# Primary AI Provider
ZHIPU_AI_API_KEY=your-zhipu-api-key
ZHIPU_AI_MODEL=glm-4.7

# Fallback AI Provider
GEMINI_API_KEY=your-gemini-api-key
GEMINI_CHAT_MODEL=gemini-2.0-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Embeddings Database (with pgvector)
EMBEDDING_DATABASE_URL=postgresql://user:pass@host:5432/embeddings_db
```

### Chat Parameters

```typescript
const CHAT_CONFIG = {
  maxTokens: 2000,           // Max response length
  temperature: 0.7,          // Creativity level
  topKChunks: 5,             // Number of chunks to retrieve
  chunkSize: 500,            // Words per chunk
  chunkOverlap: 50,          // Word overlap between chunks
  maxHistory: 10             // Messages in conversation history
};
```

## Troubleshooting

### Issue: Chat responses are generic

**Cause:** Content not extracted or embeddings not generated

**Solution:**
```bash
# Check processing status
SELECT name, extractionStatus, embeddingStatus
FROM books
WHERE id = 'book-uuid';

# Re-trigger processing
POST /api/admin/books/[id]/regenerate-embeddings
```

### Issue: Zhipu AI quota exceeded

**Cause:** Monthly API limit reached

**Solution:** System automatically falls back to Gemini. To increase Zhipu quota:
1. Log in to [Zhipu AI Console](https://open.bigmodel.cn/)
2. Navigate to billing section
3. Increase quota limit

### Issue: Slow response times

**Cause:** Large context or slow embedding search

**Solution:**
- Reduce `topKChunks` in config
- Add database indexes on `bookId` and `chunkIndex`
- Use Redis caching for frequent queries

## Performance Optimization

### Caching Strategy

```typescript
// Cache frequent queries
const cacheKey = `chat:${bookId}:${hash(message)}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const response = await generateChat(message, context);
await redis.setex(cacheKey, 3600, JSON.stringify(response)); // 1 hour
```

### Database Indexes

```sql
-- Speed up chat context queries
CREATE INDEX idx_book_chat_contexts_book_chunk
ON book_chat_contexts(bookId, chunkIndex);

-- Speed up message retrieval
CREATE INDEX idx_book_chat_messages_session
ON book_chat_messages(sessionId, messageIndex);
```

## See Also

- [BOOK_CONTENT_EXTRACTION.md](BOOK_CONTENT_EXTRACTION.md) - PDF processing pipeline
- [BOOK_CHAT_ZHIPU_AI_PLAN.md](BOOK_CHAT_ZHIPU_AI_PLAN.md) - Original implementation plan
- [SETUP.md](SETUP.md) - Environment setup
