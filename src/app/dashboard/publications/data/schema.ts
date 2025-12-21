import { z } from 'zod'

export const publicationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createPublicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

export const updatePublicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

// Types
export type Publication = z.infer<typeof publicationSchema>
export type CreatePublicationData = z.infer<typeof createPublicationSchema>
export type UpdatePublicationData = z.infer<typeof updatePublicationSchema>

// Column configuration for data table
export const publicationColumns = [
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