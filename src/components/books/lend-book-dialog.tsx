'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface User {
  id: string
  firstName: string
  lastName?: string | null
  username?: string | null
  email: string
}

interface LendBookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
  bookName: string
  onSuccess?: () => void
}

export function LendBookDialog({
  open,
  onOpenChange,
  bookId,
  bookName,
  onSuccess
}: LendBookDialogProps) {
  const [userId, setUserId] = useState('')
  const [dueDate, setDueDate] = useState<Date>()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search users
  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query)
    setError(null)

    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search users')
      }

      setSearchResults(data.data.users || [])
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleLendBook = async () => {
    setError(null)

    if (!userId) {
      setError('Please select a user')
      return
    }

    if (!dueDate) {
      setError('Please select a due date')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/books/${bookId}/lend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          dueDate: dueDate.toISOString(),
          notes: notes || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to lend book')
      }

      onSuccess?.()
      onOpenChange(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lend book')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setUserId('')
    setDueDate(undefined)
    setNotes('')
    setSearchQuery('')
    setSearchResults([])
    setError(null)
  }

  const selectedUser = searchResults.find(u => u.id === userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lend Book: {bookName}</DialogTitle>
          <DialogDescription>
            Lend this book to a user for a specific time period
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">
              Select User <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="user"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                disabled={isSubmitting}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setUserId(user.id)
                      setSearchQuery(`${user.firstName} ${user.lastName || ''} (${user.email})`)
                      setSearchResults([])
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                  >
                    <div className="font-medium">{user.firstName} {user.lastName || ''}</div>
                    <div className="text-muted-foreground text-xs">{user.email}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected User Display */}
            {selectedUser && (
              <div className="p-2 bg-accent rounded-md flex items-center justify-between">
                <span className="text-sm">{selectedUser.firstName} {selectedUser.lastName || ''} ({selectedUser.email})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUserId('')
                    setSearchQuery('')
                  }}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>
              Due Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleLendBook}
            disabled={isSubmitting || !userId || !dueDate}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Lending...
              </>
            ) : (
              'Lend Book'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
