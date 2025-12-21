import { z } from 'zod'

export const authorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createAuthorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

export const updateAuthorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

// Types
export type Author = z.infer<typeof authorSchema>
export type CreateAuthorData = z.infer<typeof createAuthorSchema>
export type UpdateAuthorData = z.infer<typeof updateAuthorSchema>

// Column configuration for data table
export const authorColumns = [
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