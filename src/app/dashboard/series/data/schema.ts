import { z } from 'zod'

const entryBySchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string(),
}).optional()

export const seriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  directImageUrl: z.string().nullable(),
  entryDate: z.string(),
  entryById: z.string(),
  entryBy: entryBySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({
    books: z.number(),
  }).optional(),
})

export type Series = z.infer<typeof seriesSchema>
