'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

interface LendBookDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
  bookName: string
  onSuccess?: () => void
}

const formSchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
  dueDate: z.date({
    required_error: 'Please select a due date',
  }),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function LendBookDrawer({
  open,
  onOpenChange,
  bookId,
  bookName,
  onSuccess
}: LendBookDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      dueDate: undefined,
      notes: '',
    },
  })

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      form.reset()
      setError(null)
      setSearchQuery('')
      setSearchResults([])
      setSelectedUser(null)
    }
  }, [open, form])

  // Update form when user is selected
  useEffect(() => {
    if (selectedUser) {
      form.setValue('userId', selectedUser.id)
    }
  }, [selectedUser, form])

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

  const onSubmit = async (data: FormValues) => {
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/books/${bookId}/lend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.userId,
          dueDate: data.dueDate.toISOString(),
          notes: data.notes || null
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to lend book')
      }

      toast({
        title: 'Success',
        description: 'Book lent successfully',
      })

      onSuccess?.()
      onOpenChange(false)
      form.reset()
      setSelectedUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lend book')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to lend book',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset()
          setSelectedUser(null)
          setSearchQuery('')
          setSearchResults([])
          setError(null)
        }
        onOpenChange(v)
      }}
    >
      <SheetContent className='flex flex-col max-w-md overflow-y-auto'>
        <SheetHeader className='text-left'>
          <SheetTitle>Lend Book</SheetTitle>
          <SheetDescription>
            Lend &quot;{bookName}&quot; to a user for a specific time period.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='lend-book-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-5 flex-1'
          >
            {error && (
              <div className='p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20'>
                {error}
              </div>
            )}

            {/* User Selection */}
            <FormField
              control={form.control}
              name='userId'
              render={() => (
                <FormItem>
                  <FormLabel>Select User <span className="text-destructive">*</span></FormLabel>
                  <div className='space-y-2'>
                    <div className='relative'>
                      <Input
                        placeholder='Search by name or email...'
                        value={searchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        disabled={loading}
                      />
                      {isSearching && (
                        <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                          <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                        </div>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {!selectedUser && searchResults.length > 0 && (
                      <div className='border rounded-md max-h-48 overflow-y-auto'>
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type='button'
                            onClick={() => {
                              setSelectedUser(user)
                              setSearchQuery(`${user.firstName} ${user.lastName || ''} (${user.email})`)
                              setSearchResults([])
                            }}
                            className='w-full text-left px-3 py-2 hover:bg-accent text-sm'
                          >
                            <div className='font-medium'>{user.firstName} {user.lastName || ''}</div>
                            <div className='text-muted-foreground text-xs'>{user.email}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected User Display */}
                    {selectedUser && (
                      <div className='p-3 bg-accent rounded-md flex items-center justify-between'>
                        <span className='text-sm'>{selectedUser.firstName} {selectedUser.lastName || ''} ({selectedUser.email})</span>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            setSelectedUser(null)
                            setSearchQuery('')
                            form.setValue('userId', '')
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name='dueDate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Due Date <span className="text-destructive">*</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={loading}
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Any additional notes...'
                      {...field}
                      disabled={loading}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline' disabled={loading}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            form='lend-book-form'
            type='submit'
            disabled={loading || !selectedUser || !form.watch('dueDate')}
          >
            {loading ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Lending...
              </>
            ) : (
              'Lend Book'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
