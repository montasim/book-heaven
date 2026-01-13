'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface Book {
  id: string
  name: string
  image: string | null
  type: string
  authorName: string
}

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string
}

interface LendBookDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LendBookDrawer({ open, onOpenChange, onSuccess }: LendBookDrawerProps) {
  const [step, setStep] = useState<'select-book' | 'select-user' | 'set-details'>('select-book')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search states
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [bookSearchResults, setBookSearchResults] = useState<Book[]>([])
  const [isSearchingBooks, setIsSearchingBooks] = useState(false)

  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setStep('select-book')
      setSelectedBook(null)
      setSelectedUser(null)
      setDueDate('')
      setNotes('')
      setError(null)
      setBookSearchQuery('')
      setUserSearchQuery('')
    }
  }, [open])

  // Search books
  useEffect(() => {
    const searchBooks = async () => {
      if (bookSearchQuery.length < 2) {
        setBookSearchResults([])
        return
      }

      setIsSearchingBooks(true)
      try {
        const response = await fetch(`/api/books?search=${encodeURIComponent(bookSearchQuery)}&type=HARD_COPY&limit=10`)
        const data = await response.json()
        if (data.success) {
          setBookSearchResults(data.data.books || [])
        }
      } catch (err) {
        console.error('Error searching books:', err)
      } finally {
        setIsSearchingBooks(false)
      }
    }

    const timeoutId = setTimeout(searchBooks, 300)
    return () => clearTimeout(timeoutId)
  }, [bookSearchQuery])

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (userSearchQuery.length < 2) {
        setUserSearchResults([])
        return
      }

      setIsSearchingUsers(true)
      try {
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(userSearchQuery)}`)
        const data = await response.json()
        if (data.success) {
          setUserSearchResults(data.data.users || [])
        }
      } catch (err) {
        console.error('Error searching users:', err)
      } finally {
        setIsSearchingUsers(false)
      }
    }

    const timeoutId = setTimeout(searchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [userSearchQuery])

  const handleSubmit = async () => {
    if (!selectedBook || !selectedUser || !dueDate) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/${selectedBook.id}/lend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          dueDate,
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to lend book')
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lend book')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.username || user.email
  }

  // Set minimum due date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDueDate = tomorrow.toISOString().split('T')[0]

  // Set maximum due date to 1 year from now
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1)
  const maxDueDate = maxDate.toISOString().split('T')[0]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Lend Book to User</SheetTitle>
          <SheetDescription>
            {step === 'select-book' && 'Search and select a hard copy book to lend'}
            {step === 'select-user' && 'Search and select a user to lend the book to'}
            {step === 'set-details' && 'Set the due date and add notes'}
          </SheetDescription>
        </SheetHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 px-6 pb-4">
            <Badge variant={step === 'select-book' ? 'default' : 'secondary'}>1. Book</Badge>
            <div className="w-8 h-0.5 bg-muted" />
            <Badge variant={step === 'select-user' ? 'default' : 'secondary'}>2. User</Badge>
            <div className="w-8 h-0.5 bg-muted" />
            <Badge variant={step === 'set-details' ? 'default' : 'secondary'}>3. Details</Badge>
          </div>

          <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[60vh]">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {step === 'select-book' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="book-search">Search Hard Copy Books</Label>
                  <Input
                    id="book-search"
                    placeholder="Search by book name or author..."
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isSearchingBooks ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      Searching...
                    </div>
                  ) : bookSearchResults.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      {bookSearchQuery.length < 2
                        ? 'Type at least 2 characters to search'
                        : 'No hard copy books found'}
                    </div>
                  ) : (
                    bookSearchResults.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          setSelectedBook(book)
                          setStep('select-user')
                          setBookSearchQuery('')
                          setBookSearchResults([])
                        }}
                        className="w-full p-3 rounded-lg border hover:bg-accent text-left transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className="h-16 w-12 rounded bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
                            {book.image ? (
                              <img
                                src={getProxiedImageUrl(book.image) || book.image}
                                alt={book.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Calendar className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium line-clamp-1">{book.name}</div>
                            <div className="text-sm text-muted-foreground">{book.authorName}</div>
                            <Badge variant="outline" className="mt-1">Hard Copy</Badge>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {step === 'select-user' && (
              <>
                {selectedBook && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm font-medium">Selected Book:</div>
                    <div className="text-sm">{selectedBook.name}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="user-search">Search Users</Label>
                  <Input
                    id="user-search"
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isSearchingUsers ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      Searching...
                    </div>
                  ) : userSearchResults.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      {userSearchQuery.length < 2
                        ? 'Type at least 2 characters to search'
                        : 'No users found'}
                    </div>
                  ) : (
                    userSearchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user)
                          setStep('set-details')
                          setUserSearchQuery('')
                          setUserSearchResults([])
                        }}
                        className="w-full p-3 rounded-lg border hover:bg-accent text-left transition-colors"
                      >
                        <div className="font-medium">{getUserName(user)}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </button>
                    ))
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('select-book')}
                >
                  Back to Book Selection
                </Button>
              </>
            )}

            {step === 'set-details' && (
              <div className="space-y-4">
                {selectedBook && selectedUser && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">Book:</span> {selectedBook.name}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Borrower:</span> {getUserName(selectedUser)}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="due-date">
                    Due Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="due-date"
                    type="date"
                    min={minDueDate}
                    max={maxDueDate}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select a date between tomorrow and 1 year from now
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes or conditions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('select-user')}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !dueDate}
                  >
                    {isSubmitting ? 'Lending...' : 'Lend Book'}
                  </Button>
                </div>
              </div>
            )}
          </div>
      </SheetContent>
    </Sheet>
  )
}
