'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'

// Repository imports
import {
  getPublications as getPublicationsFromDb,
  getPublicationById as getPublicationByIdFromDb,
  createPublication as createPublicationInDb,
  updatePublication as updatePublicationInDb,
  deletePublication as deletePublicationFromDb,
  publicationNameExists,
} from '@/lib/lms/repositories/publication.repository'

// ============================================================================
// SCHEMAS
// ============================================================================

const publicationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createPublicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

const updatePublicationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
})

// Types
export type Publication = z.infer<typeof publicationSchema>
export type CreatePublicationData = z.infer<typeof createPublicationSchema>
export type UpdatePublicationData = z.infer<typeof updatePublicationSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get all publications
 */
export async function getPublications() {
  try {
    const result = await getPublicationsFromDb()

    // Transform data for UI
    return result.publications.map(publication => ({
      id: publication.id,
      name: publication.name,
      description: publication.description || '',
      image: publication.image || '',
      entryDate: publication.entryDate.toISOString(),
      entryBy: `${publication.entryBy.firstName} ${publication.entryBy.lastName}`.trim() || publication.entryBy.email,
      entryById: publication.entryBy.id,
      createdAt: publication.createdAt.toISOString(),
      updatedAt: publication.updatedAt.toISOString(),
      bookCount: publication._count.books,
    }))
  } catch (error) {
    console.error('Error fetching publications:', error)
    return []
  }
}

/**
 * Get publication by ID
 */
export async function getPublicationById(id: string) {
  try {
    const publication = await getPublicationByIdFromDb(id)

    if (!publication) {
      throw new Error('Publication not found')
    }

    return {
      id: publication.id,
      name: publication.name,
      description: publication.description || '',
      image: publication.image || '',
      entryDate: publication.entryDate.toISOString(),
      entryBy: `${publication.entryBy.firstName} ${publication.entryBy.lastName}`.trim() || publication.entryBy.email,
      entryById: publication.entryBy.id,
      createdAt: publication.createdAt.toISOString(),
      updatedAt: publication.updatedAt.toISOString(),
      books: publication.books.map(bookPublication => ({
        id: bookPublication.book.id,
        name: bookPublication.book.name,
        type: bookPublication.book.type,
        image: bookPublication.book.image || '',
      })),
    }
  } catch (error) {
    console.error('Error fetching publication:', error)
    throw error
  }
}

/**
 * Create a new publication
 */
export async function createPublication(formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
    }

    const validatedData = createPublicationSchema.parse(rawData)

    // Check if publication name already exists
    const nameExists = await publicationNameExists(validatedData.name)
    if (nameExists) {
      throw new Error('A publication with this name already exists')
    }

    // Create publication
    await createPublicationInDb({
      name: validatedData.name,
      description: validatedData.description,
      image: validatedData.image,
      entryById: session.adminId,
    })

    revalidatePath('/dashboard/publications')
    return { message: 'Publication created successfully' }
  } catch (error) {
    console.error('Error creating publication:', error)
    throw error || new Error('Failed to create publication')
  }
}

/**
 * Update a publication
 */
export async function updatePublication(id: string, formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
    }

    const validatedData = updatePublicationSchema.parse(rawData)

    // Check if publication name already exists (excluding current publication)
    const nameExists = await publicationNameExists(validatedData.name, id)
    if (nameExists) {
      throw new Error('A publication with this name already exists')
    }

    // Update publication
    await updatePublicationInDb(id, {
      name: validatedData.name,
      description: validatedData.description,
      image: validatedData.image,
    })

    revalidatePath('/dashboard/publications')
    return { message: 'Publication updated successfully' }
  } catch (error) {
    console.error('Error updating publication:', error)
    throw error || new Error('Failed to update publication')
  }
}

/**
 * Delete a publication
 */
export async function deletePublication(id: string) {
  try {
    await deletePublicationFromDb(id)
    revalidatePath('/dashboard/publications')
    return { message: 'Publication deleted successfully' }
  } catch (error) {
    console.error('Error deleting publication:', error)
    throw error || new Error('Failed to delete publication')
  }
}

/**
 * Check publication name availability
 */
export async function checkPublicationNameAvailability(name: string, excludeId?: string) {
  try {
    const exists = await publicationNameExists(name, excludeId)

    if (exists) {
      return { isAvailable: false, error: 'Publication name already exists.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking publication name availability:', error)
    return { isAvailable: false, error: 'Failed to validate publication name.' }
  }
}