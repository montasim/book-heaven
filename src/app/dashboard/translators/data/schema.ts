import { z } from 'zod'

export const translatorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createTranslatorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
})

export const updateTranslatorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.union([z.string(), z.any()]).optional(),
})

// Types
export type Translator = z.infer<typeof translatorSchema>
export type CreateTranslatorData = z.infer<typeof createTranslatorSchema>
export type UpdateTranslatorData = z.infer<typeof updateTranslatorSchema>

// Column configuration for data table
export const translatorColumns = [
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
