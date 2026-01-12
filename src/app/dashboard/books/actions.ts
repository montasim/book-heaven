'use server'

import { revalidatePath, unstable_noStore } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { uploadFile, deleteFile } from '@/lib/google-drive'
import { config } from '@/config'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'
import { validateRequest, sanitizeUserContent } from '@/lib/validation'
import { sendBookUploadNotificationEmail, sendBookPublishedNotificationEmail } from '@/lib/auth/email'
import { notifyPdfProcessor } from '@/lib/pdf-processor/notifier'
import { invalidateBooksCache } from '@/lib/cache/redis'

// Repository imports
import {
  getBooks as getBooksFromDb,
  getBookById as getBookByIdFromDb,
  createBook as createBookInDb,
  updateBook as updateBookInDb,
  deleteBook as deleteBookFromDb,
  getAllAuthors,
  getAllTranslators,
  getAllPublications,
  getBookTypes,
} from '@/lib/lms/repositories/book.repository'

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// SCHEMAS
// ============================================================================

const bookSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  image: z.string().optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  summary: z.string().optional(),
  buyingPrice: z.number().nullable(),
  sellingPrice: z.number().nullable(),
  numberOfCopies: z.number().nullable(),
  purchaseDate: z.string().nullable(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authors: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  publications: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
})

const createBookSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((val) => sanitizeUserContent(val, 500)),
  image: z.union([z.string(), z.any()]).optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  bindingType: z.enum(['HARDCOVER', 'PAPERBACK']).optional().nullable(),
  pageNumber: z.string().optional().nullable(),
  fileUrl: z.union([z.string(), z.any()]).optional().nullable(),
  summary: z.string().optional().transform((val) => val ? sanitizeUserContent(val, 5000) : val),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  translatorIds: z.array(z.string()).optional(),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
  series: z.array(z.object({
    seriesId: z.string(),
    order: z.number(),
  })).optional(),
  isPublic: z.boolean().default(false),
  requiresPremium: z.boolean().default(false),
  featured: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Validate image format (PNG only)
  if (data.image instanceof File && data.image.type !== 'image/png') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG images are allowed',
      path: ['image'],
    });
  }

  if (data.type === 'HARD_COPY') {
    if (!data.bindingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Binding type is required for hard copy books-old',
        path: ['bindingType'],
      });
    }
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
  } else if (data.type === 'EBOOK') {
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for eBooks',
        path: ['fileUrl'],
      });
    }
  } else if (data.type === 'AUDIO') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for audio books-old',
        path: ['fileUrl'],
      });
    }
  }
});

const updateBookSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((val) => sanitizeUserContent(val, 500)),
  image: z.union([z.string(), z.any()]).optional(),
  type: z.enum(['HARD_COPY', 'EBOOK', 'AUDIO']),
  bindingType: z.enum(['HARDCOVER', 'PAPERBACK']).optional().nullable(),
  pageNumber: z.string().optional().nullable(),
  fileUrl: z.union([z.string(), z.any()]).optional().nullable(),
  summary: z.string().optional().transform((val) => val ? sanitizeUserContent(val, 5000) : val),
  buyingPrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  numberOfCopies: z.string().optional(),
  purchaseDate: z.string().optional(),
  authorIds: z.array(z.string()).min(1, 'At least one author is required'),
  translatorIds: z.array(z.string()).optional(),
  publicationIds: z.array(z.string()).min(1, 'At least one publication is required'),
  categoryIds: z.array(z.string()).optional(),
  series: z.array(z.object({
    seriesId: z.string(),
    order: z.number(),
  })).optional(),
  isPublic: z.boolean().default(false),
  requiresPremium: z.boolean().default(false),
  featured: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Validate image format (PNG only)
  if (data.image instanceof File && data.image.type !== 'image/png') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG images are allowed',
      path: ['image'],
    });
  }

  if (data.type === 'HARD_COPY') {
    if (!data.bindingType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Binding type is required for hard copy books-old',
        path: ['bindingType'],
      });
    }
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
  } else if (data.type === 'EBOOK') {
    if (!data.pageNumber || isNaN(Number(data.pageNumber)) || Number(data.pageNumber) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Page number is required and must be a positive number',
        path: ['pageNumber'],
      });
    }
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for eBooks',
        path: ['fileUrl'],
      });
    }
  } else if (data.type === 'AUDIO') {
    if (!data.fileUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'File is required for audio books-old',
        path: ['fileUrl'],
      });
    }
  }
});

// Types
export type Book = z.infer<typeof bookSchema>
export type CreateBookData = z.infer<typeof createBookSchema>
export type UpdateBookData = z.infer<typeof updateBookSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get paginated books
 */
export async function getBooks(options?: { page?: number; pageSize?: number }) {
  // Disable caching to always get fresh data
  unstable_noStore()

  // Capture pageSize for use in catch block
  const { page = 1, pageSize: defaultPageSize = 10 } = options || {}

  try {
    const result = await getBooksFromDb({ page, limit: defaultPageSize })

    // Transform data for UI
    const books = result.books.map(book => {
        // Handle entryBy - check if it exists and has required properties
        let entryByName = 'Unknown'
        if (book.entryBy && typeof book.entryBy === 'object') {
            entryByName = book.entryBy.name || book.entryBy.email || 'Unknown'
        }

      return {
          id: book.id,
          name: book.name,
          image: book.image || '',
          directImageUrl: book.directImageUrl || null,
          type: book.type,
          bindingType: book.bindingType,
          pageNumber: book.pageNumber,
          fileUrl: book.fileUrl || '',
          directFileUrl: book.directFileUrl || null,
          summary: book.summary || '',
          extractedContent: book.extractedContent || null,
          buyingPrice: book.buyingPrice,
          sellingPrice: book.sellingPrice,
          numberOfCopies: book.numberOfCopies,
          purchaseDate: book.purchaseDate?.toISOString() || null,
          isPublic: book.isPublic ?? false,
          requiresPremium: book.requiresPremium ?? false,
          featured: book.featured ?? false,
          entryDate: book.entryDate.toISOString(),
          entryBy: entryByName,
          entryById: book.entryBy?.id,
          createdAt: book.createdAt.toISOString(),
          updatedAt: book.updatedAt.toISOString(),
          authors: book.authors.map(bookAuthor => ({
              id: bookAuthor.author.id,
              name: bookAuthor.author.name,
          })),
          translators: book.translators?.map(bookTranslator => ({
              id: bookTranslator.translator.id,
              name: bookTranslator.translator.name,
          })) || [],
          publications: book.publications.map(bookPublication => ({
              id: bookPublication.publication.id,
              name: bookPublication.publication.name,
          })),
          categories: book.categories.map(bookCategory => ({
              id: bookCategory.category.id,
              name: bookCategory.category.name,
          }))
      };
    })

    return {
      books,
      pagination: result.pagination
    }
  } catch (error) {
    console.error('Error fetching books:', error)
    return {
      books: [],
      pagination: {
        total: 0,
        pages: 0,
        current: 1,
        limit: defaultPageSize
      }
    }
  }
}

/**
 * Get book by ID
 */
export async function getBookById(id: string) {
  try {
    const book = await getBookByIdFromDb(id)

    if (!book) {
      throw new Error('Book not found')
    }

    return {
      id: book.id,
      name: book.name,
      image: book.image || '',
      directImageUrl: book.directImageUrl || null,
      type: book.type,
      bindingType: book.bindingType,
      pageNumber: book.pageNumber ? book.pageNumber.toString() : '',
      fileUrl: book.fileUrl || '',
      directFileUrl: book.directFileUrl || null,
      summary: book.summary || '',
      extractedContent: book.extractedContent || null,
      buyingPrice: book.buyingPrice,
      sellingPrice: book.sellingPrice,
      numberOfCopies: book.numberOfCopies,
      purchaseDate: book.purchaseDate?.toISOString() || null,
      isPublic: book.isPublic ?? false,
      requiresPremium: book.requiresPremium ?? false,
      featured: book.featured ?? false,
      entryDate: book.entryDate.toISOString(),
      entryBy: book.entryBy.name || book.entryBy.email,
      entryById: book.entryBy.id,
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      authors: book.authors.map(bookAuthor => ({
        id: bookAuthor.author.id,
        name: bookAuthor.author.name,
      })),
      translators: book.translators ? book.translators.map(bookTranslator => ({
        id: bookTranslator.translator.id,
        name: bookTranslator.translator.name,
      })) : [],
      publications: book.publications.map(bookPublication => ({
        id: bookPublication.publication.id,
        name: bookPublication.publication.name,
      })),
      categories: book.categories.map(bookCategory => ({
        id: bookCategory.category.id,
        name: bookCategory.category.name,
      })),
      series: book.series.map(bookSeries => ({
        seriesId: bookSeries.series.id,
        seriesName: bookSeries.series.name,
        order: bookSeries.order,
      })),
      authorIds: book.authors.map(bookAuthor => bookAuthor.author.id),
      translatorIds: book.translators ? book.translators.map(bookTranslator => bookTranslator.translator.id) : [],
      publicationIds: book.publications.map(bookPublication => bookPublication.publication.id),
      categoryIds: book.categories.map(bookCategory => bookCategory.category.id),
    }
  } catch (error) {
    console.error('Error fetching book:', error)
    throw error
  }
}

/**
 * Get all authors for selection
 */
export async function getAuthorsForSelect() {
  try {
    return await getAllAuthors()
  } catch (error) {
    console.error('Error fetching authors for select:', error)
    return []
  }
}

/**
 * Get all translators for selection
 */
export async function getTranslatorsForSelect() {
  try {
    return await getAllTranslators()
  } catch (error) {
    console.error('Error fetching translators for select:', error)
    return []
  }
}

/**
 * Get all publications for selection
 */
export async function getPublicationsForSelect() {
  try {
    return await getAllPublications()
  } catch (error) {
    console.error('Error fetching publications for select:', error)
    return []
  }
}

/**
 * Get all categories for selection
 */
export async function getCategoriesForSelect() {
  try {
    const { prisma } = await import('@/lib/prisma')

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return categories.map(c => ({
      id: c.id,
      name: c.name,
    }))
  } catch (error) {
    console.error('Error fetching categories for select:', error)
    return []
  }
}

/**
 * Get book types for selection
 */
export async function getBookTypesForSelect() {
  try {
    return getBookTypes()
  } catch (error) {
    console.error('Error fetching book types:', error)
    return []
  }
}

/**
 * Create a new book
 */
export async function createBook(formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      image: formData.get('image'),
      type: formData.get('type') as 'HARD_COPY' | 'EBOOK' | 'AUDIO',
      bindingType: formData.get('bindingType') as 'HARDCOVER' | 'PAPERBACK' | undefined | null,
      pageNumber: formData.get('pageNumber') as string | undefined | null,
      fileUrl: formData.get('fileUrl'),
      summary: formData.get('summary') as string,
      buyingPrice: formData.get('buyingPrice') as string,
      sellingPrice: formData.get('sellingPrice') as string,
      numberOfCopies: formData.get('numberOfCopies') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      isPublic: formData.get('isPublic') === 'true',
      requiresPremium: formData.get('requiresPremium') === 'true',
      featured: formData.get('featured') === 'true',
      authorIds: formData.getAll('authorIds') as string[],
      translatorIds: formData.getAll('translatorIds') as string[] || [],
      publicationIds: formData.getAll('publicationIds') as string[],
      categoryIds: formData.getAll('categoryIds') as string[],
    }

    // Handle null/undefined values for optional fields
    if (!rawData.bindingType) rawData.bindingType = null;
    if (!rawData.pageNumber) rawData.pageNumber = null;
    if (!rawData.fileUrl) rawData.fileUrl = null;

    const validatedData = createBookSchema.parse(rawData)

    // Handle file uploads
    console.log('[Book Actions] Handling file uploads...')
    let imageUrl = null
    let directImageUrl = null
    if (validatedData.image instanceof File) {
      console.log('[Book Actions] Uploading image to Google Drive...')
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
      directImageUrl = uploadResult.directUrl
      console.log('[Book Actions] Image uploaded successfully')
    } else if (typeof validatedData.image === 'string') {
      imageUrl = validatedData.image
      // Generate direct URL if it's a Google Drive URL
      const fileIdMatch = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (fileIdMatch) {
        directImageUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
      }
    }

    let fileUrl = null
    let directFileUrl = null
    if (validatedData.fileUrl instanceof File) {
      console.log('[Book Actions] Uploading PDF to Google Drive...')
      const uploadResult = await uploadFile(validatedData.fileUrl, config.google.driveFolderId)
      fileUrl = uploadResult.previewUrl
      directFileUrl = uploadResult.directUrl
      console.log('[Book Actions] PDF uploaded successfully')
    } else if (typeof validatedData.fileUrl === 'string') {
      fileUrl = validatedData.fileUrl
      // Generate direct URL if it's a Google Drive URL
      const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (fileIdMatch) {
        directFileUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
      }
    }

    // Convert string values to appropriate types
    const processedData = {
      name: validatedData.name,
      image: imageUrl,
      directImageUrl: directImageUrl,
      type: validatedData.type,
      bindingType: validatedData.bindingType || null,
      pageNumber: validatedData.pageNumber ? parseInt(validatedData.pageNumber) : null,
      fileUrl: fileUrl,
      directFileUrl: directFileUrl,
      summary: validatedData.summary || null,
      buyingPrice: validatedData.buyingPrice ? parseFloat(validatedData.buyingPrice) : null,
      sellingPrice: validatedData.sellingPrice ? parseFloat(validatedData.sellingPrice) : null,
      numberOfCopies: validatedData.numberOfCopies ? parseInt(validatedData.numberOfCopies) : null,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
      isPublic: validatedData.isPublic,
      requiresPremium: validatedData.requiresPremium,
      featured: validatedData.featured,
      entryById: session.userId,
      authorIds: validatedData.authorIds,
      translatorIds: validatedData.translatorIds,
      publicationIds: validatedData.publicationIds,
      categoryIds: validatedData.categoryIds || [],
      series: validatedData.series || [],
    }

    // Create book
    console.log('[Book Actions] Creating book in database...')
    console.log('[Book Actions] Book data:', {
      name: processedData.name,
      type: processedData.type,
      pageNumber: processedData.pageNumber,
      fileUrl: processedData.fileUrl ? 'SET' : 'NULL',
      authorIds: processedData.authorIds,
      publicationIds: processedData.publicationIds,
    })

    const createdBook = await createBookInDb({
      ...processedData,
      image: processedData.image ?? undefined,
      directImageUrl: processedData.directImageUrl ?? undefined,
      fileUrl: processedData.fileUrl ?? undefined,
      directFileUrl: processedData.directFileUrl ?? undefined,
      summary: processedData.summary ?? undefined,
      bindingType: processedData.bindingType ?? undefined,
      pageNumber: processedData.pageNumber ?? undefined,
      buyingPrice: processedData.buyingPrice ?? undefined,
      sellingPrice: processedData.sellingPrice ?? undefined,
      numberOfCopies: processedData.numberOfCopies ?? undefined,
      purchaseDate: processedData.purchaseDate ?? undefined,
    })

    console.log('[Book Actions] Book created:', createdBook ? 'SUCCESS' : 'FAILED', createdBook?.id)

    if (!createdBook) {
      return { error: 'Failed to create book' }
    }

    // Log book creation activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.BOOK_CREATED,
      resourceType: ActivityResourceType.BOOK,
      resourceId: createdBook.id,
      resourceName: processedData.name,
      description: `Created book "${processedData.name}"`,
      metadata: {
        type: processedData.type,
        authorCount: processedData.authorIds?.length || 0,
        categoryCount: processedData.categoryIds?.length || 0,
      },
      endpoint: '/dashboard/books/actions',
    }).catch(console.error)

    // Send book upload notification email (non-blocking)
    sendBookUploadNotificationEmail(session.email, processedData.name, createdBook.id).catch(console.error)

    // Notify PDF processor service for ebooks/audiobooks (non-blocking)
    console.log('[Book Actions] Checking PDF processing notification conditions:', {
      type: processedData.type,
      hasFileUrl: !!processedData.fileUrl,
      hasCreatedBook: !!createdBook,
      bookId: createdBook?.id,
    })

    if ((processedData.type === 'EBOOK' || processedData.type === 'AUDIO') && processedData.fileUrl && createdBook) {
      console.log('[Book Actions] Notifying PDF processor service...')

      // Get author names for the processor
      const authorNames = createdBook.authors?.map(a => a.author?.name).filter(Boolean) || []

      // Notify socket server to trigger PDF processing (fire and forget)
      notifyPdfProcessor({
        bookId: createdBook.id,
        pdfUrl: createdBook.fileUrl || '',
        directPdfUrl: createdBook.directFileUrl,
        bookName: createdBook.name,
        authorNames,
      }).catch(err => {
        console.error('[Book Actions] Failed to notify PDF processor:', err)
      })
    } else {
      console.log('[Book Actions] Skipping PDF processing notification (conditions not met)')
    }

    revalidatePath('/dashboard/books')
    return {
      message: 'Book created successfully',
      note: (processedData.type === 'EBOOK' || processedData.type === 'AUDIO')
        ? 'Book content is being prepared for AI chat. This may take 30-60 seconds.'
        : undefined
    }
  } catch (error) {
    console.error('Error creating book:', error)
    // Handle ZodError - extract first error message
    if (error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)) {
      const firstError = error.issues[0]
      throw new Error(firstError?.message || 'Failed to create book')
    }
    // Handle regular Error
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to create book')
  }
}

/**
 * Update a book
 */
export async function updateBook(id: string, formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Get existing book to handle file deletions
    const existingBook = await getBookByIdFromDb(id)
    if (!existingBook) {
      throw new Error('Book not found')
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      image: formData.get('image'),
      type: formData.get('type') as 'HARD_COPY' | 'EBOOK' | 'AUDIO',
      bindingType: formData.get('bindingType') as 'HARDCOVER' | 'PAPERBACK' | undefined | null,
      pageNumber: formData.get('pageNumber') as string | undefined | null,
      fileUrl: formData.get('fileUrl'),
      summary: formData.get('summary') as string,
      buyingPrice: formData.get('buyingPrice') as string,
      sellingPrice: formData.get('sellingPrice') as string,
      numberOfCopies: formData.get('numberOfCopies') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      isPublic: formData.get('isPublic') === 'true',
      requiresPremium: formData.get('requiresPremium') === 'true',
      featured: formData.get('featured') === 'true',
      authorIds: formData.getAll('authorIds') as string[],
      translatorIds: formData.getAll('translatorIds') as string[] || [],
      publicationIds: formData.getAll('publicationIds') as string[],
      categoryIds: formData.getAll('categoryIds') as string[],
    }

    // Handle null/undefined values for optional fields
    if (!rawData.bindingType) rawData.bindingType = null;
    if (!rawData.pageNumber) rawData.pageNumber = null;
    if (!rawData.fileUrl) rawData.fileUrl = null;

    const validatedData = updateBookSchema.parse(rawData)

    // Handle file uploads and deletions
    let imageUrl = existingBook.image
    let directImageUrl = existingBook.directImageUrl
    if (validatedData.image instanceof File) {
      // Upload new file
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
      directImageUrl = uploadResult.directUrl
      // Delete old file if it exists
      if (existingBook.image) {
        await deleteFile(existingBook.image)
      }
    } else if (validatedData.image === '' || validatedData.image === null) {
      // If image is explicitly removed
      if (existingBook.image) {
        await deleteFile(existingBook.image)
      }
      imageUrl = null
      directImageUrl = null
    } else if (typeof validatedData.image === 'string') {
      // Keep existing URL
      imageUrl = validatedData.image
      // Generate direct URL if not present
      if (!directImageUrl) {
        const fileIdMatch = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
        if (fileIdMatch) {
          directImageUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
        }
      }
    }

    let fileUrl = existingBook.fileUrl
    let directFileUrl = existingBook.directFileUrl
    if (validatedData.fileUrl instanceof File) {
      // Upload new file
      const uploadResult = await uploadFile(validatedData.fileUrl, config.google.driveFolderId)
      fileUrl = uploadResult.previewUrl
      directFileUrl = uploadResult.directUrl
      // Delete old file if it exists
      if (existingBook.fileUrl) {
        await deleteFile(existingBook.fileUrl)
      }
    } else if (validatedData.fileUrl === '' || validatedData.fileUrl === null) {
      // If file is explicitly removed
      if (existingBook.fileUrl) {
        await deleteFile(existingBook.fileUrl)
      }
      fileUrl = null
      directFileUrl = null
    } else if (typeof validatedData.fileUrl === 'string') {
      // Keep existing URL
      fileUrl = validatedData.fileUrl
      // Generate direct URL if not present
      if (!directFileUrl) {
        const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
        if (fileIdMatch) {
          directFileUrl = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
        }
      }
    }

    // Convert string values to appropriate types
    const processedData = {
      name: validatedData.name,
      image: imageUrl,
      directImageUrl: directImageUrl,
      type: validatedData.type,
      bindingType: validatedData.bindingType || null,
      pageNumber: validatedData.pageNumber ? parseInt(validatedData.pageNumber) : null,
      fileUrl: fileUrl,
      directFileUrl: directFileUrl,
      summary: validatedData.summary || null,
      buyingPrice: validatedData.buyingPrice ? parseFloat(validatedData.buyingPrice) : null,
      sellingPrice: validatedData.sellingPrice ? parseFloat(validatedData.sellingPrice) : null,
      numberOfCopies: validatedData.numberOfCopies ? parseInt(validatedData.numberOfCopies) : null,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
      isPublic: validatedData.isPublic,
      requiresPremium: validatedData.requiresPremium,
      featured: validatedData.featured,
      authorIds: validatedData.authorIds,
      translatorIds: validatedData.translatorIds,
      publicationIds: validatedData.publicationIds,
      categoryIds: validatedData.categoryIds || [],
      series: validatedData.series || [],
    }

    // Check if file URL changed
    const fileChanged = existingBook.fileUrl !== fileUrl

    // Check if book is being made public (was false, now true)
    const beingMadePublic = !existingBook.isPublic && processedData.isPublic

    // Update book
    await updateBookInDb(id, processedData)

    // Log book update activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.BOOK_UPDATED,
      resourceType: ActivityResourceType.BOOK,
      resourceId: id,
      resourceName: processedData.name,
      description: `Updated book "${processedData.name}"`,
      metadata: {
        type: processedData.type,
        fileChanged,
        madePublic: beingMadePublic,
      },
      endpoint: '/dashboard/books/actions',
    }).catch(console.error)

    // Send book published notification email if book was made public (non-blocking)
    if (beingMadePublic) {
      sendBookPublishedNotificationEmail(session.email, processedData.name, id).catch(console.error)
    }

    // Clear content cache and trigger re-processing if file changed
    if (fileChanged && (processedData.type === 'EBOOK' || processedData.type === 'AUDIO') && processedData.fileUrl) {
      // Import repository functions
      const { clearBookExtractedContent } = await import('@/lib/lms/repositories/book.repository')

      // Clear existing content to force re-processing
      await clearBookExtractedContent(id)

      // Notify socket server to trigger PDF processing (fire and forget)
      console.log('[Book Actions] File changed, notifying PDF processor service...')

      // Get the updated book to get author names
      const updatedBook = await getBookByIdFromDb(id)
      if (updatedBook) {
        const authorNames = updatedBook.authors?.map(a => a.author?.name).filter(Boolean) || []

        notifyPdfProcessor({
          bookId: id,
          pdfUrl: updatedBook.fileUrl || '',
          directPdfUrl: updatedBook.directFileUrl,
          bookName: updatedBook.name,
          authorNames,
        }).catch(err => {
          console.error('[Book Actions] Failed to notify PDF processor:', err)
        })
      }
    }

    revalidatePath('/dashboard/books')
    return {
      message: 'Book updated successfully',
      note: fileChanged && (processedData.type === 'EBOOK' || processedData.type === 'AUDIO')
        ? 'Book content is being re-prepared for AI chat. This may take 30-60 seconds.'
        : undefined
    }
  } catch (error) {
    console.error('Error updating book:', error)
    // Handle ZodError - extract first error message
    if (error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)) {
      const firstError = error.issues[0]
      throw new Error(firstError?.message || 'Failed to update book')
    }
    // Handle regular Error
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update book')
  }
}

/**
 * Delete a book
 */
export async function deleteBook(id: string) {
  try {
    // Get authenticated user
    const session = await requireAuth()

    // Get existing book to handle file deletions
    const existingBook = await getBookByIdFromDb(id)
    if (existingBook) {
      if (existingBook.image) {
        await deleteFile(existingBook.image)
      }
      if (existingBook.fileUrl) {
        await deleteFile(existingBook.fileUrl)
      }

      // Log book deletion activity (non-blocking)
      logActivity({
        userId: session.userId,
        userRole: session.role as any,
        action: ActivityAction.BOOK_DELETED,
        resourceType: ActivityResourceType.BOOK,
        resourceId: id,
        resourceName: existingBook.name,
        description: `Deleted book "${existingBook.name}"`,
        metadata: {
          type: existingBook.type,
        },
        endpoint: '/dashboard/books/actions',
      }).catch(console.error)
    }

    await deleteBookFromDb(id)
    revalidatePath('/dashboard/books')
    return { message: 'Book deleted successfully' }
  } catch (error) {
    console.error('Error deleting book:', error)
    // Handle ZodError - extract first error message
    if (error && typeof error === 'object' && 'issues' in error && Array.isArray(error.issues)) {
      const firstError = error.issues[0]
      throw new Error(firstError?.message || 'Failed to delete book')
    }
    // Handle regular Error
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete book')
  }
}

/**
 * Get all series for select dropdown
 */
export async function getSeriesForSelect() {
  try {
    const { prisma } = await import('@/lib/prisma')

    const series = await prisma.series.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return series.map(s => ({
      id: s.id,
      name: s.name,
    }))
  } catch (error) {
    console.error('Error fetching series:', error)
    return []
  }
}

/**
 * Invalidate all books cache
 */
export async function invalidateCache() {
  try {
    const session = await requireAuth()

    await invalidateBooksCache()

    // Log cache invalidation activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.BOOK_UPDATED,
      resourceType: ActivityResourceType.BOOK,
      resourceId: 'all',
      resourceName: 'All Books Cache',
      description: 'Invalidated all books cache',
      endpoint: '/dashboard/books/actions',
    }).catch(console.error)

    return { message: 'Books cache invalidated successfully' }
  } catch (error) {
    console.error('Error invalidating cache:', error)
    throw new Error('Failed to invalidate cache')
  }
}
