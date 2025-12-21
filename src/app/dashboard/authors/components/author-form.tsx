'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageUpload } from '@/components/ui/image-upload'
import { MDXEditor } from '@/components/ui/mdx-editor'

const authorFormSchema = z.object({
  name: z.string().min(1, 'Author name is required'),
  image: z.union([z.string(), z.instanceof(File)]).optional(),
  biography: z.string().optional(),
})

type AuthorFormValues = z.infer<typeof authorFormSchema>

interface AuthorFormProps {
  initialData?: Partial<AuthorFormValues>
  onSubmit: (data: FormData) => Promise<void>
  isEdit?: boolean
  onCancel: () => void
  loading: boolean
}

export function AuthorForm({ initialData, onSubmit, isEdit = false, onCancel, loading }: AuthorFormProps) {
  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      image: initialData?.image || undefined,
      biography: initialData?.biography || '',
    },
  })

  const onFormSubmit = async (values: AuthorFormValues) => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value)
      } else if (value) {
        formData.append(key, value as string)
      }
    })
    await onSubmit(formData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author Name *</FormLabel>
              <FormControl>
                <Input placeholder='Enter author name' {...field} />
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
                  onRemove={() => field.onChange(undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='biography'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography</FormLabel>
              <FormControl>
                <MDXEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder='Enter author biography in markdown format...'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-4'>
          <Button type='button' variant='outline' onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type='submit' disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Author' : 'Create Author'}
          </Button>
        </div>
      </form>
    </Form>
  )
}