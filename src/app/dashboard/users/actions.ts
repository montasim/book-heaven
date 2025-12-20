'use server'

import { revalidatePath } from 'next/cache'
import { User, userSchema } from './data/schema'
import { users } from './data/users'

// Get all users
export async function getUsers() {
  return users
}

// Create new user
export async function createUser(formData: FormData) {
  const rawData = {
    id: `USER-${Math.floor(Math.random() * 10000)}`,
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    username: formData.get('username'),
    email: formData.get('email'),
    phoneNumber: formData.get('phoneNumber'),
    role: formData.get('role'),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const validatedData = userSchema.parse(rawData)
  users.push(validatedData)

  revalidatePath('/users')
  return { message: 'User created successfully' }
}

// Update user
export async function updateUser(id: string, formData: FormData) {
  const index = users.findIndex(user => user.id === id)
  if (index === -1) {
    throw new Error('User not found')
  }

  const rawData = {
    ...users[index],
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    username: formData.get('username'),
    email: formData.get('email'),
    phoneNumber: formData.get('phoneNumber'),
    role: formData.get('role'),
    updatedAt: new Date().toISOString(),
  }

  const validatedData = userSchema.parse(rawData)
  users[index] = validatedData

  revalidatePath('/users')
  return { message: 'User updated successfully' }
}

// Delete user
export async function deleteUser(id: string) {
  const index = users.findIndex(user => user.id === id)
  if (index === -1) {
    throw new Error('User not found')
  }

  users.splice(index, 1)

  revalidatePath('/users')
  return { message: 'User deleted successfully' }
}

// Invite user
export async function inviteUser(formData: FormData) {
  const rawData = {
    id: `USER-${Math.floor(Math.random() * 10000)}`,
    firstName: '',
    lastName: '',
    username: formData.get('email')?.toString().split('@')[0] || '',
    email: formData.get('email'),
    phoneNumber: '',
    role: formData.get('role'),
    status: 'invited',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const validatedData = userSchema.parse(rawData)
  users.push(validatedData)

  revalidatePath('/users')
  return { message: 'User invited successfully' }
}

// Check email availability
export async function checkEmailAvailability(email: string) {
  // We need to dynamically import these to avoid circular dependencies if any,
  // or just import them at top level if fine. 
  // Given this is a server action file, imports should be fine.

  const { adminExists } = await import('@/lib/auth/repositories/admin.repository')
  const { activeInviteExists } = await import('@/lib/auth/repositories/invite.repository')

  try {
    const isAdmin = await adminExists(email)
    if (isAdmin) {
      return { isAvailable: false, error: 'Email is already registered as an admin.' }
    }

    const hasInvite = await activeInviteExists(email)
    if (hasInvite) {
      // Just a warning, or strict blocking? User said: "if the email is already registered. if registered disable the Invite button"
      // User didn't explicitly say block if invited.
      // But typically we warn.
      return { isAvailable: false, error: 'An active invite already exists for this email.' }
    }

    return { isAvailable: true }
  } catch (error) {
    console.error('Error checking email availability:', error)
    return { isAvailable: false, error: 'Failed to validate email.' }
  }
}
