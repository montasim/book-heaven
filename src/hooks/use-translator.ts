import { useQuery } from '@tanstack/react-query'
import { Book } from './use-book'

export interface Translator {
  id: string
  name: string
  description: string | null
  image: string | null
  directImageUrl: string | null
  entryDate: string
  entryBy: {
    id: string
    firstName: string
    lastName: string | null
    username: string | null
    name: string
    avatar: string | null
    bio: string | null
  } | null
  books: Book[]
  statistics: {
    totalBooks: number
    totalReaders: number
  }
  analytics?: {
    totalViews: number
  }
}

export interface TranslatorDetailResponse {
  success: boolean
  data: {
    translator: Translator
  }
  message: string
}

interface UseTranslatorOptions {
  id: string
}

export function useTranslator({ id }: UseTranslatorOptions) {
  return useQuery({
    queryKey: ['translator', id],
    queryFn: async (): Promise<TranslatorDetailResponse> => {
      const response = await fetch(`/api/public/translators/${id}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch translator' }))
        throw new Error(error.message || 'Failed to fetch translator details')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
