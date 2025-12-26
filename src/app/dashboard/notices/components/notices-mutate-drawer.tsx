'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Notice } from '../data/schema'
import { createNotice, updateNotice } from '../actions'
import { MDXEditor } from '@/components/ui/mdx-editor'

const noticeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isActive: z.boolean().default(true),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  order: z.number().default(0),
})

type NoticeFormValues = z.infer<typeof noticeFormSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Notice | null
  onSuccess?: () => void
}

export function NoticesMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow
  const [loading, setLoading] = useState(false)

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: '',
      content: '',
      isActive: true,
      validFrom: null,
      validTo: null,
      order: 0,
    },
    mode: 'onChange',
  })

  // Reset form when drawer opens or data changes
  useEffect(() => {
    if (open) {
      if (isUpdate && currentRow) {
        form.reset({
          title: currentRow.title || '',
          content: currentRow.content || '',
          isActive: currentRow.isActive ?? true,
          validFrom: currentRow.validFrom || null,
          validTo: currentRow.validTo || null,
          order: currentRow.order ?? 0,
        })
      } else {
        form.reset()
      }
    }
  }, [open, currentRow, isUpdate, form])

  const onSubmit = async (data: NoticeFormValues) => {
    setLoading(true)
    try {
      if (isUpdate && currentRow) {
        await updateNotice(currentRow.id, data)
        toast({
          title: 'Notice updated successfully',
        })
      } else {
        await createNotice(data)
        toast({
          title: 'Notice created successfully',
        })
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isUpdate ? 'update' : 'create'} notice`,
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
        }
        onOpenChange(v)
      }}
    >
      <SheetContent className="flex flex-col overflow-y-auto max-w-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Notice</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the notice details.'
              : 'Add a new notice to display to users.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id="notices-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 flex-1"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New books available!" {...field} />
                  </FormControl>
                  <FormDescription>
                    A short, attention-grabbing headline for the notice
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <MDXEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Enter notice content in markdown format..."
                    />
                  </FormControl>
                  <FormDescription>
                    The main message content of the notice (supports markdown)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid From</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: When should this notice start showing?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid To</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: When should this notice stop showing?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Lower numbers appear first
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Show this notice to users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button
            form="notices-form"
            type="submit"
            disabled={loading || !form.formState.isValid}
          >
            {loading ? 'Saving...' : isUpdate ? 'Update Notice' : 'Create Notice'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
