'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
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
import { MDXEditor } from '@/components/ui/mdx-editor'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Author } from '../data/schema'
import { createAuthor, updateAuthor } from '../actions'
import {
  checkAuthorNameAvailability,
} from '../actions'
import { cn } from '@/lib/utils'
import { IconLoader2, IconCheck, IconX } from '@tabler/icons-react'
import { ImageUpload } from '@/components/ui/image-upload'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Author
  onSuccess?: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Author name is required.'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
})

type AuthorForm = z.infer<typeof formSchema>

export function AuthorsMutateDrawer({ open, onOpenChange, currentRow, onSuccess }: Props) {
  const isUpdate = !!currentRow

  const [loading, setLoading] = useState(false)
  const [checkingFields, setCheckingFields] = useState<Set<string>>(new Set())
  const [fieldAvailability, setFieldAvailability] = useState<{
    name?: boolean
  }>({})

  const form = useForm<AuthorForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (open) {
      const defaultValues = isUpdate && currentRow ? {
        name: currentRow.name || '',
        description: currentRow.description || '',
        image: currentRow.image || '',
      } : {
        name: '',
        description: '',
        image: '',
      };
      form.reset(defaultValues);
      if (isUpdate) {
        setFieldAvailability({ name: true });
      } else {
        setFieldAvailability({});
      }
    }
  }, [open, currentRow, isUpdate, form]);

  const nameValue = form.watch('name')

  useEffect(() => {
    const checkName = async () => {
      if (!nameValue || (isUpdate && nameValue === currentRow?.name)) {
        if (isUpdate) setFieldAvailability(prev => ({ ...prev, name: true }));
        return
      }
      if (!isUpdate && !form.formState.dirtyFields.name) return

      const isNameValid = await form.trigger('name')
      if (!isNameValid) return

      setCheckingFields(prev => new Set(prev).add('name'))
      setFieldAvailability(prev => ({ ...prev, name: undefined }))

      try {
        const result = await checkAuthorNameAvailability(nameValue, currentRow?.id)
        if (result.isAvailable) {
          setFieldAvailability(prev => ({ ...prev, name: true }))
          form.clearErrors('name')
        } else {
          setFieldAvailability(prev => ({ ...prev, name: false }))
          form.setError('name', {
            type: 'manual',
            message: result.error || 'Author name is not available',
          })
        }
      } catch (error) {
        console.error('Author name check failed:', error)
      } finally {
        setCheckingFields(prev => {
          const next = new Set(prev)
          next.delete('name')
          return next
        })
      }
    }

    const timeoutId = setTimeout(() => {
      if (open && nameValue) checkName()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [nameValue, form, currentRow?.id, isUpdate, currentRow?.name, open])

  const onSubmit = async (data: AuthorForm) => {
    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value)
        } else if (value !== null && value !== undefined) {
          formData.append(key, value as string)
        }
      })

      if (isUpdate && currentRow) {
        await updateAuthor(currentRow.id, formData)
        toast({
          title: 'Author updated successfully',
        })
      } else {
        await createAuthor(formData)
        toast({
          title: 'Author created successfully',
        })
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isUpdate ? 'update' : 'create'} author`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormDisabled = () => {
    if (loading || checkingFields.size > 0) return true
    if (!form.formState.isValid) return true
    if (fieldAvailability.name === false) return true
    return false
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          form.reset();
        }
        onOpenChange(v)
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Author</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the author by providing necessary info.'
              : 'Add a new author by providing necessary info.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='authors-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-5 flex-1'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Author Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder='Enter author name'
                        className={cn(
                          fieldAvailability.name === false && "border-red-500 focus-visible:ring-red-500",
                          fieldAvailability.name === true && "border-green-500 focus-visible:ring-green-500"
                        )}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingFields.has('name') && <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!checkingFields.has('name') && fieldAvailability.name === true && <IconCheck className="h-4 w-4 text-green-500" />}
                        {!checkingFields.has('name') && fieldAvailability.name === false && <IconX className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <MDXEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder='Enter author description (e.g., biography, works, achievements) in markdown format...'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='image'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange(null)}
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
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button
            form='authors-form'
            type='submit'
            disabled={isFormDisabled()}
          >
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}