import { z } from 'zod'
import { RequestStatus, BookType } from '@prisma/client'

export const bookRequestSchema = z.object({
  id: z.string(),
  bookName: z.string(),
  authorName: z.string(),
  type: z.nativeEnum(BookType),
  edition: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  isbn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(RequestStatus),
  requestedById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  requestedBy: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string().nullable(),
    username: z.string().nullable(),
    name: z.string(),
    email: z.string(),
  }).optional(),
})

export type BookRequest = z.infer<typeof bookRequestSchema>
