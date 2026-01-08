import { generateEmbedding } from './gemini-embeddings'
import { searchSimilarChunks, hasBookEmbeddings } from '@/lib/lms/repositories/book-embedding.repository'
import { getBookWithExtractedContent } from '@/lib/lms/repositories/book.repository'
import { config } from '@/config'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  bookId: string
  bookName: string
  bookType: string
  pdfUrl: string
  pdfDirectUrl?: string | null
  authors: string[]
  categories: string[]
  messages: ChatMessage[]
}

export interface ChatResponse {
  response: string
  model: string
  method: 'embedding' | 'full-content' | 'fallback'
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Format retrieved chunks for AI context
 */
function formatChunksForAI(chunks: Array<{ chunkText: string; pageNumber: number | null; similarity: number }>, maxChunks = 10): string {
  return chunks
    .slice(0, maxChunks)
    .map((chunk, index) => {
      const pageRef = chunk.pageNumber !== null ? ` (Page ${chunk.pageNumber})` : ''
      const similarityPct = Math.round(chunk.similarity * 100)
      return `[Excerpt ${index + 1}${pageRef} - Relevance: ${similarityPct}%]\n${chunk.chunkText}`
    })
    .join('\n\n---\n\n')
}

/**
 * Generate chat response using Gemini AI
 */
async function generateGeminiResponse(messages: ChatMessage[]): Promise<{ content: string; usage: any }> {
  const apiKey = config.geminiApiKey

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables')
  }

  // Use configurable model from env (defaults to gemini-1.5-flash for free tier availability)
  const model = config.geminiChatModel

  // Convert messages to Gemini format
  // Gemini doesn't use system message, so we prepend it to the first user message
  const systemMessage = messages.find(m => m.role === 'system')
  const chatMessages = messages.filter(m => m.role !== 'system')

  let contents: any[] = []

  if (systemMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: `${systemMessage.content}\n\n${chatMessages[0]?.content || ''}` }]
    })
    contents = contents.concat(
      chatMessages.slice(1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    )
  } else {
    contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 8000,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Gemini Chat] API Error Response:', errorText)
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini')
  }

  const candidate = data.candidates[0]
  const content = candidate.content?.parts?.[0]?.text || ''

  return {
    content,
    usage: {
      promptTokens: data.usageMetadata?.totalTokenCount || 0,
      completionTokens: 0, // Gemini doesn't separate completion tokens
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    }
  }
}

/**
 * Main RAG-style chat function using embeddings
 * 1. Generate embedding for user query using Gemini
 * 2. Search for similar chunks using pgvector
 * 3. Use retrieved chunks as context for Gemini AI
 */
export async function chatWithRAG(request: ChatRequest): Promise<ChatResponse> {
  console.log('[RAG Chat] Starting RAG-style chat for book:', request.bookId)

  // Get the last user message for embedding generation
  const lastUserMessage = request.messages
    .filter(m => m.role === 'user')
    .pop()

  if (!lastUserMessage) {
    throw new Error('No user message found in conversation history')
  }

  // Check if embeddings exist for this book
  const hasEmbeddings = await hasBookEmbeddings(request.bookId)

  let bookContent = ''
  let method: 'embedding' | 'full-content' | 'fallback' = 'fallback'

  if (hasEmbeddings) {
    console.log('[RAG Chat] Embeddings found, using RAG approach')
    try {
      // Generate embedding for the user's query
      const queryEmbedding = await generateEmbedding(lastUserMessage.content)
      console.log('[RAG Chat] Generated query embedding, dimension:', queryEmbedding.length)

      // Search for similar chunks (get top 10 most relevant chunks)
      const similarChunks = await searchSimilarChunks(request.bookId, queryEmbedding, 10)
      console.log('[RAG Chat] Found', similarChunks.length, 'relevant chunks')
      console.log('[RAG Chat] Similarity scores:', similarChunks.map(c => `${c.similarity.toFixed(3)}`).join(', '))

      if (similarChunks.length > 0) {
        // Log first chunk to debug content
        console.log('[RAG Chat] First chunk preview (200 chars):', similarChunks[0]?.chunkText?.slice(0, 200) || 'EMPTY')
        console.log('[RAG Chat] First chunk page:', similarChunks[0]?.pageNumber)
        console.log('[RAG Chat] First chunk length:', similarChunks[0]?.chunkText?.length || 0)

        // Check if chunks have actual content
        const totalContentLength = similarChunks.reduce((sum, c) => sum + (c.chunkText?.length || 0), 0)
        console.log('[RAG Chat] Total content length across all chunks:', totalContentLength)

        // If chunks are empty, fall back to full content
        if (totalContentLength === 0) {
          console.log('[RAG Chat] Chunks are empty, falling back to full content')
          const bookWithContent = await getBookWithExtractedContent(request.bookId)
          if (bookWithContent?.extractedContent) {
            bookContent = bookWithContent.extractedContent.slice(0, 50000) // Limit to ~50k chars for Gemini
            method = 'full-content'
          }
        } else {
          // Format chunks for AI context
          bookContent = formatChunksForAI(similarChunks)
          method = 'embedding'
          console.log('[RAG Chat] Using', similarChunks.length, 'chunks as context')
          console.log('[RAG Chat] Top chunk similarity:', similarChunks[0]?.similarity.toFixed(3), 'Lowest chunk similarity:', similarChunks[similarChunks.length - 1]?.similarity.toFixed(3))
        }
      } else {
        console.log('[RAG Chat] No chunks found, falling back to full content')
        const bookWithContent = await getBookWithExtractedContent(request.bookId)
        if (bookWithContent?.extractedContent) {
          bookContent = bookWithContent.extractedContent.slice(0, 50000)
          method = 'full-content'
        }
      }
    } catch (error) {
      console.error('[RAG Chat] Embedding search failed:', error)
      const bookWithContent = await getBookWithExtractedContent(request.bookId)
      if (bookWithContent?.extractedContent) {
        bookContent = bookWithContent.extractedContent.slice(0, 50000)
        method = 'full-content'
      }
    }
  } else {
    console.log('[RAG Chat] No embeddings found, falling back to full content')
    const bookWithContent = await getBookWithExtractedContent(request.bookId)
    if (bookWithContent?.extractedContent) {
      bookContent = bookWithContent.extractedContent.slice(0, 50000)
      method = 'full-content'
    }
  }

  // Build system prompt
  const authors = request.authors.join(', ')
  const categories = request.categories.join(', ')

  const systemPrompt = `You are a knowledgeable AI assistant for a digital library platform.

Your task is to answer questions about the book "${request.bookName}" by ${authors} (${categories}).

**LANGUAGE DETECTION AND RESPONSE:**
1. Detect the language of the user's message (Bengali or English)
2. Respond in the SAME language as the user's message
3. If the user writes in Bengali (বাংলা), respond in Bengali
4. If the user writes in English, respond in English
5. The book content may be in Bengali or English - handle both languages appropriately

**CRITICAL RULES:**
1. Base ALL answers ONLY on the book content provided below
2. If information is not found in the book content, explicitly say so
3. Provide specific examples and quotes from the book when possible
4. Reference page numbers when citing specific content
5. Be concise yet comprehensive
6. Maintain a conversational, helpful tone
7. If asked about topics not covered in the book, politely redirect to what IS available
8. Match your response language to the user's question language

${bookContent ? `**BOOK CONTENT TO USE:**
${bookContent}` : '**BOOK CONTENT:** [No content available]'}

**BOOK METADATA:**
- Title: ${request.bookName}
- Authors: ${authors}
- Categories: ${categories}
- Type: ${request.bookType}

Provide accurate, helpful responses based strictly on this book's content, ALWAYS matching the user's language (Bengali or English).`

  // Prepare messages for API (exclude system message from history)
  const apiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages
  ]

  // Call Gemini AI API
  console.log('[RAG Chat] Calling Gemini AI API with method:', method, 'model:', config.geminiChatModel)

  const { content: responseContent, usage } = await generateGeminiResponse(apiMessages)

  return {
    response: responseContent,
    model: config.geminiChatModel,
    method,
    usage,
  }
}
