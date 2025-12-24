'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookOpen } from 'lucide-react'
import { BookType } from '@prisma/client'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const formSchema = z.object({
  bookName: z.string().min(1, 'Book name is required.'),
  authorName: z.string().min(1, 'Author name is required.'),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO'] as const),
  edition: z.string().optional(),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
})

type BookRequestForm = z.infer<typeof formSchema>

export function RequestBookDrawer({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const form = useForm<BookRequestForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bookName: '',
      authorName: '',
      type: 'HARD_COPY',
      edition: '',
      publisher: '',
      isbn: '',
      description: '',
    },
  })

  const onSubmit = async (data: BookRequestForm) => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/book-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: result.message })
        form.reset()
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast({ title: result.message, variant: 'destructive' })
      }
    } catch (error: any) {
      console.error('Error submitting request:', error)
      toast({ title: 'Failed to submit request', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: BookType) => {
    switch (type) {
      case 'HARD_COPY':
        return 'Hard Copy'
      case 'EBOOK':
        return 'E-Book'
      case 'AUDIO':
        return 'Audio Book'
      default:
        return type
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset()
        }
        onOpenChange(v)
      }}
    >
      <SheetContent className="flex flex-col max-w-2xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Request a Book</SheetTitle>
          <SheetDescription>
            Request a book to be added to the library. Provide as many details as possible
            to help us process your request faster.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id="request-book-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 flex-1 mt-4"
          >
            <FormField
              control={form.control}
              name="bookName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Book Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter book title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Author <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter author name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Book Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select book type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HARD_COPY">Hard Copy</SelectItem>
                      <SelectItem value="EBOOK">E-Book</SelectItem>
                      <SelectItem value="AUDIO">Audio Book</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the format you prefer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="edition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edition</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 2nd Edition" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="978-0-1234567-8-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="publisher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publisher</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter publisher name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormDescription>
                    Any additional information about the book (optional)
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter book description, summary, or any additional notes..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button
            form="request-book-form"
            type="submit"
            disabled={loading || !form.formState.isValid}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
