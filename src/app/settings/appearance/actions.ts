'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { findAdminById, updateAdmin } from '@/lib/auth/repositories/admin.repository'
import { appearanceFormSchema, type AppearanceFormValues } from './schema'

type GetAppearanceResult =
  | { status: 'success', data: AppearanceFormValues }
  | { status: 'error', message: string }

export async function getAppearance(): Promise<GetAppearanceResult> {
  try {
    const session = await requireAuth()
    const admin = await findAdminById(session.adminId)

    if (!admin) {
      return { status: 'error', message: 'Admin not found' }
    }

    return {
      status: 'success',
      data: {
        theme: (admin.theme as any) || 'light',
        font: (admin.font as any) || 'inter',
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch appearance'
    }
  }
}

type UpdateAppearanceResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateAppearance(data: AppearanceFormValues): Promise<UpdateAppearanceResult> {
  const validatedData = appearanceFormSchema.parse(data)

  try {
    const session = await requireAuth()
    const currentAdmin = await findAdminById(session.adminId)

    if (!currentAdmin) {
      return { status: 'error', message: 'Admin not found' }
    }

    // Update admin with appearance data
    await updateAdmin(session.adminId, {
      theme: validatedData.theme,
      font: validatedData.font,
    })

    // Revalidate cache
    revalidatePath('/settings/appearance')

    return { status: 'success', message: 'Appearance updated successfully' }
  } catch (error) {
    console.error('Error updating appearance:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update appearance'
    }
  }
}
