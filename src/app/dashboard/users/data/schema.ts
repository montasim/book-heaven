import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('USER'),
  z.literal('ADMIN'),
  z.literal('SUPER_ADMIN'),
])
export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  id: z.string(),
  name: z.string(), // This comes from Admin.firstName + Admin.lastName (full name)
  email: z.string().email(),
  status: userStatusSchema.default('active'), // All registered admins are active
  role: userRoleSchema.default('ADMIN'), // All admins have admin role for now
  createdAt: z.string(),
  updatedAt: z.string(),

  // All UI fields (derived from Admin model)
  firstName: z.string(),
  lastName: z.string().optional(), // Optional field
  username: z.string(),
  phoneNumber: z.string().optional(), // Optional field
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
