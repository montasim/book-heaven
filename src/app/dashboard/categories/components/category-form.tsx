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

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  image: z.union([z.string(), z.instanceof(File)]).optional(),
  description: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  initialData?: Partial<CategoryFormValues>
  onSubmit: (data: FormData) => Promise<void>
  isEdit?: boolean
  onCancel: () => void
  loading: boolean
}

export function CategoryForm({ initialData, onSubmit, isEdit = false, onCancel, loading }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      image: initialData?.image || undefined,
      description: initialData?.description || '',
    },
  })

  const onFormSubmit = async (values: CategoryFormValues) => {
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
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input placeholder='Enter category name' {...field} />
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
              <FormLabel>Category Image</FormLabel>
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
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <MDXEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder='Enter category description in markdown format...'
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
            {loading ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Form>
  )
}