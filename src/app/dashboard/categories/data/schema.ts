import { z } from 'zod'

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

// Types
export type Category = z.infer<typeof categorySchema>
export type CreateCategoryData = z.infer<typeof createCategorySchema>
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>

// Column configuration for data table
export const categoryColumns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
  },
  {
    key: 'bookCount',
    label: 'Books',
    sortable: true,
  },
  {
    key: 'entryDate',
    label: 'Entry Date',
    sortable: true,
  },
  {
    key: 'entryBy',
    label: 'Entry By',
    sortable: true,
  },
]