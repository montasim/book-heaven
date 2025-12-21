'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/session'
import { findAdminById, updateAdmin } from '@/lib/auth/repositories/admin.repository'
import { accountFormSchema, type AccountFormValues } from './schema'

type GetAccountResult =
  | { status: 'success', data: AccountFormValues }
  | { status: 'error', message: string }

export async function getAccount(): Promise<GetAccountResult> {
  try {
    const session = await requireAuth()
    const admin = await findAdminById(session.adminId)

    if (!admin) {
      return { status: 'error', message: 'Admin not found' }
    }

    return {
      status: 'success',
      data: {
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        dob: admin.dob ? new Date(admin.dob) : new Date('2000-01-01'),
        language: admin.language || 'en',
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch account'
    }
  }
}

type UpdateAccountResult =
  | { status: 'success', message: string }
  | { status: 'error', message: string }

export async function updateAccount(data: AccountFormValues): Promise<UpdateAccountResult> {
  const validatedData = accountFormSchema.parse(data)

  try {
    const session = await requireAuth()
    const currentAdmin = await findAdminById(session.adminId)

    if (!currentAdmin) {
      return { status: 'error', message: 'Admin not found' }
    }

    // Update admin with account data
    await updateAdmin(session.adminId, {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      dob: validatedData.dob,
      language: validatedData.language,
    })

    // Revalidate cache
    revalidatePath('/settings/account')

    return { status: 'success', message: 'Account updated successfully' }
  } catch (error) {
    console.error('Error updating account:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update account'
    }
  }
}
