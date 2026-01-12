'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { z } from 'zod'
import { uploadFile, deleteFile } from '@/lib/google-drive'
import { config } from '@/config'
import { logActivity } from '@/lib/activity/logger'
import { ActivityAction, ActivityResourceType } from '@prisma/client'
import { sanitizeUserContent } from '@/lib/validation'

// Repository imports
import {
  getTranslators as getTranslatorsFromDb,
  getTranslatorById as getTranslatorByIdFromDb,
  createTranslator as createTranslatorInDb,
  updateTranslator as updateTranslatorInDb,
  deleteTranslator as deleteTranslatorFromDb,
  translatorNameExists,
} from '@/lib/lms/repositories/translator.repository'

// ============================================================================
// SCHEMAS
// ============================================================================

const translatorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  entryDate: z.string(),
  entryBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createTranslatorSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((val) => sanitizeUserContent(val, 200)),
  description: z.string().optional().transform((val) => val ? sanitizeUserContent(val, 5000) : val),
  image: z.union([z.string(), z.any()]).optional(),
}).superRefine((data, ctx) => {
  // Validate image format (PNG only)
  if (data.image instanceof File && data.image.type !== 'image/png') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG images are allowed',
      path: ['image'],
    });
  }
});

const updateTranslatorSchema = z.object({
  name: z.string().min(1, 'Name is required').transform((val) => sanitizeUserContent(val, 200)),
  description: z.string().optional().transform((val) => val ? sanitizeUserContent(val, 5000) : val),
  image: z.union([z.string(), z.any()]).optional(),
}).superRefine((data, ctx) => {
  // Validate image format (PNG only)
  if (data.image instanceof File && data.image.type !== 'image/png') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only PNG images are allowed',
      path: ['image'],
    });
  }
});

// Types
export type Translator = z.infer<typeof translatorSchema>
export type CreateTranslatorData = z.infer<typeof createTranslatorSchema>
export type UpdateTranslatorData = z.infer<typeof updateTranslatorSchema>

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Get paginated translators
 */
export async function getTranslators(options?: { page?: number; pageSize?: number }) {
  const { page = 1, pageSize: defaultPageSize = 10 } = options || {}

  try {
    const result = await getTranslatorsFromDb({ page, limit: defaultPageSize })

    // Transform data for UI
    const translators = result.translators.map(translator => {
      // Handle entryBy - check if it exists and has required properties
      let entryByName = 'Unknown'
      if (translator.entryBy && typeof translator.entryBy === 'object') {
        const name = `${translator.entryBy.firstName || ''} ${translator.entryBy.lastName || ''}`.trim()
        entryByName = name || translator.entryBy.email || 'Unknown'
      }

      return {
        id: translator.id,
        name: translator.name,
        description: translator.description || '',
        image: translator.image || '',
        entryDate: translator.entryDate.toISOString(),
        entryBy: entryByName,
        entryById: translator.entryBy?.id,
        createdAt: translator.createdAt.toISOString(),
        updatedAt: translator.updatedAt.toISOString(),
        bookCount: translator._count.books,
      }
    })

    return {
      translators,
      pagination: result.pagination
    }
  } catch (error) {
    console.error('Error fetching translators:', error)
    return {
      translators: [],
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
 * Get translator by ID
 */
export async function getTranslatorById(id: string) {
  try {
    const translator = await getTranslatorByIdFromDb(id)

    if (!translator) {
      throw new Error('Translator not found')
    }

    // Handle entryBy - check if it exists and has required properties
    let entryByName = 'Unknown'
    if (translator.entryBy && typeof translator.entryBy === 'object') {
      const name = `${translator.entryBy.firstName || ''} ${translator.entryBy.lastName || ''}`.trim()
      entryByName = name || translator.entryBy.email || 'Unknown'
    }

    return {
      id: translator.id,
      name: translator.name,
      description: translator.description || '',
      image: translator.image || '',
      entryDate: translator.entryDate.toISOString(),
      entryBy: entryByName,
      entryById: translator.entryBy?.id,
      createdAt: translator.createdAt.toISOString(),
      updatedAt: translator.updatedAt.toISOString(),
      books: translator.books.map(bookTranslator => ({
        id: bookTranslator.book.id,
        name: bookTranslator.book.name,
        type: bookTranslator.book.type,
        image: bookTranslator.book.image || '',
      })),
    }
  } catch (error) {
    console.error('Error fetching translator:', error)
    throw error
  }
}

/**
 * Create a new translator
 */
export async function createTranslator(formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image'),
    }

    const validatedData = createTranslatorSchema.parse(rawData)

    // Check if translator name already exists
    const nameExists = await translatorNameExists(validatedData.name)
    if (nameExists) {
      throw new Error('A translator with this name already exists')
    }

    // Handle file upload
    let imageUrl = null
    if (validatedData.image instanceof File) {
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
    } else if (typeof validatedData.image === 'string') {
      imageUrl = validatedData.image
    }

    // Create translator
    const createdTranslator = await createTranslatorInDb({
      name: validatedData.name,
      description: validatedData.description,
      image: imageUrl || undefined,
      entryById: session.userId,
    })

    // Log translator creation activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.TRANSLATOR_CREATED,
      resourceType: ActivityResourceType.TRANSLATOR,
      resourceId: createdTranslator.id,
      resourceName: validatedData.name,
      description: `Created translator "${validatedData.name}"`,
      endpoint: '/dashboard/translators/actions',
    }).catch(console.error)

    revalidatePath('/dashboard/translators')
    return { message: 'Translator created successfully' }
  } catch (error) {
    console.error('Error creating translator:', error)
    throw error || new Error('Failed to create translator')
  }
}

/**
 * Update a translator
 */
export async function updateTranslator(id: string, formData: FormData) {
  try {
    // Get authenticated admin
    const session = await requireAuth()

    // Get existing translator to handle file deletions
    const existingTranslator = await getTranslatorByIdFromDb(id)
    if (!existingTranslator) {
      throw new Error('Translator not found')
    }

    // Extract and validate form data
    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image'),
    }

    const validatedData = updateTranslatorSchema.parse(rawData)

    // Check if translator name already exists (excluding current translator)
    const nameExists = await translatorNameExists(validatedData.name, id)
    if (nameExists) {
      throw new Error('A translator with this name already exists')
    }

    // Handle file upload and deletion
    let imageUrl = existingTranslator.image
    if (validatedData.image instanceof File) {
      // Upload new file
      const uploadResult = await uploadFile(validatedData.image, config.google.driveFolderId)
      imageUrl = uploadResult.previewUrl
      // Delete old file if it exists
      if (existingTranslator.image) {
        await deleteFile(existingTranslator.image)
      }
    } else if (validatedData.image === '' || validatedData.image === null) {
      // If image is explicitly removed
      if (existingTranslator.image) {
        await deleteFile(existingTranslator.image)
      }
      imageUrl = null
    } else if (typeof validatedData.image === 'string') {
      // Keep existing URL
      imageUrl = validatedData.image
    }

    // Update translator
    await updateTranslatorInDb(id, {
      name: validatedData.name,
      description: validatedData.description,
      image: imageUrl || undefined,
    })

    // Log translator update activity (non-blocking)
    logActivity({
      userId: session.userId,
      userRole: session.role as any,
      action: ActivityAction.TRANSLATOR_UPDATED,
      resourceType: ActivityResourceType.TRANSLATOR,
      resourceId: id,
      resourceName: validatedData.name,
      description: `Updated translator "${validatedData.name}"`,
      endpoint: '/dashboard/translators/actions',
    }).catch(console.error)

    revalidatePath('/dashboard/translators')
    return { message: 'Translator updated successfully' }
  } catch (error) {
    console.error('Error updating translator:', error)
    throw error || new Error('Failed to update translator')
  }
}

/**
 * Delete a translator
 */
export async function deleteTranslator(id: string) {
  try {
    // Get authenticated user
    const session = await requireAuth()

    // Get existing translator to handle file deletions
    const existingTranslator = await getTranslatorByIdFromDb(id)
    if (existingTranslator) {
      if (existingTranslator.image) {
        await deleteFile(existingTranslator.image)
      }

      // Log translator deletion activity (non-blocking)
      logActivity({
        userId: session.userId,
        userRole: session.role as any,
        action: ActivityAction.TRANSLATOR_DELETED,
        resourceType: ActivityResourceType.TRANSLATOR,
        resourceId: id,
        resourceName: existingTranslator.name,
        description: `Deleted translator "${existingTranslator.name}"`,
        endpoint: '/dashboard/translators/actions',
      }).catch(console.error)
    }

    await deleteTranslatorFromDb(id)
    revalidatePath('/dashboard/translators')
    return { message: 'Translator deleted successfully' }
  } catch (error) {
    console.error('Error deleting translator:', error)
    throw error || new Error('Failed to delete translator')
  }
}

/**
 * Check translator name availability
 */
export async function checkTranslatorNameAvailability(name: string, excludeId?: string) {
  try {
    const exists = await translatorNameExists(name, excludeId)

    if (exists) {
      return { isAvailable: false, error: 'Translator name already exists.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking translator name availability:', error)
    return { isAvailable: false, error: 'Failed to validate translator name.' }
  }
}
