'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { findAdminById, updateAdmin } from '@/lib/auth/repositories/admin.repository'
import { notificationsFormSchema, type NotificationsFormValues } from './schema'

type GetNotificationsResult =
  | { status: 'success', data: NotificationsFormValues }
  | { status: 'error', message: string }

export async function getNotifications(): Promise<GetNotificationsResult> {
  try {
    const session = await requireAuth()
    const admin = await findAdminById(session.adminId)

    if (!admin) {
      return { status: 'error', message: 'Admin not found' }
    }

    return {
      status: 'success',
      data: {
        notificationType: (admin.notificationType as any) || 'all',
        mobileNotifications: admin.mobileNotifications || false,
        communicationEmails: admin.communicationEmails || false,
        socialEmails: admin.socialEmails || false,
        marketingEmails: admin.marketingEmails || false,
        securityEmails: admin.securityEmails !== false, // Default to true
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch notification settings'
    }
  }
}

type UpdateNotificationsResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateNotifications(data: NotificationsFormValues): Promise<UpdateNotificationsResult> {
  const validatedData = notificationsFormSchema.parse(data)

  try {
    const session = await requireAuth()
    const currentAdmin = await findAdminById(session.adminId)

    if (!currentAdmin) {
      return { status: 'error', message: 'Admin not found' }
    }

    // Update admin with notification data
    await updateAdmin(session.adminId, {
      notificationType: validatedData.notificationType,
      mobileNotifications: validatedData.mobileNotifications,
      communicationEmails: validatedData.communicationEmails,
      socialEmails: validatedData.socialEmails,
      marketingEmails: validatedData.marketingEmails,
      securityEmails: validatedData.securityEmails,
    })

    // Revalidate cache
    revalidatePath('/settings/notifications')

    return { status: 'success', message: 'Notification settings updated successfully' }
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update notification settings'
    }
  }
}
