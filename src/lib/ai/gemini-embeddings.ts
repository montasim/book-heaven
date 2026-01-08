import { config } from '@/config'

/**
 * Generate embedding for a single text using Gemini AI
 * Gemini's text-embedding-004 returns 768-dimensional vectors
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = config.geminiApiKey

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables')
  }

  const model = config.geminiEmbeddingModel || 'text-embedding-004'

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[GeminiEmbeddings] API Error:', errorText)
    throw new Error(`Gemini API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as {
    embedding?: {
      values: number[]
    }
  }

  if (!data.embedding?.values) {
    throw new Error('No embedding returned from Gemini')
  }

  return data.embedding.values
}

/**
 * Generate embeddings for multiple texts
 * Processes in parallel with concurrency limit
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return []
  }

  const results: number[][] = []
  const concurrency = 10

  console.log(`[GeminiEmbeddings] Generating embeddings for ${texts.length} texts with concurrency ${concurrency}...`)

  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency)
    const batchPromises = batch.map((text, index) =>
      generateEmbedding(text).catch((error) => {
        console.error(`[GeminiEmbeddings] Failed for text ${i + index}:`, error.message)
        return null
      })
    )

    const batchResults = await Promise.all(batchPromises)

    for (const result of batchResults) {
      if (result) {
        results.push(result)
      } else {
        // Add a zero vector as fallback
        results.push(new Array(768).fill(0))
      }
    }

    // Small delay to avoid rate limits
    if (i + concurrency < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}
