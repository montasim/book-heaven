'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
  initialValue?: string
  value?: string
  debounceMs?: number
}

export function SearchBar({
  onSearch,
  placeholder = "Search books...",
  className,
  initialValue = '',
  value: controlledValue,
  debounceMs = 300
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(initialValue)
  const router = useRouter()

  // Use controlled value if provided, otherwise use local state
  const query = controlledValue !== undefined ? controlledValue : localQuery

  // Update local state when initialValue changes
  useEffect(() => {
    if (controlledValue === undefined) {
      setLocalQuery(initialValue)
    }
  }, [initialValue, controlledValue])

  // Debounced search callback
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null
      return (searchQuery: string) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
          onSearch?.(searchQuery.trim())
        }, debounceMs)
      }
    })(),
    [onSearch, debounceMs]
  )

  const handleChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setLocalQuery(newValue)
    }
    // Trigger debounced search
    debouncedSearch(newValue)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedQuery = query.trim()

    if (trimmedQuery) {
      if (onSearch) {
        onSearch(trimmedQuery)
      } else {
        router.push(`/books?search=${encodeURIComponent(trimmedQuery)}`)
      }
    } else if (onSearch) {
      // Clear search if query is empty
      onSearch('')
    }
  }

  const handleClear = () => {
    if (controlledValue === undefined) {
      setLocalQuery('')
    }
    if (onSearch) {
      onSearch('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-10 pr-12"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleClear}
          >
            ×
          </Button>
        )}
      </div>
    </form>
  )
}