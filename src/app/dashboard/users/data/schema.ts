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

const subscriptionPlanSchema = z.union([
  z.literal('FREE'),
  z.literal('PREMIUM'),
  z.literal('PREMIUM_PLUS'),
])
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: userStatusSchema.default('active'),
  role: userRoleSchema.default('USER'),
  createdAt: z.string(),
  updatedAt: z.string(),

  // UI fields
  firstName: z.string(),
  lastName: z.string().optional(),
  username: z.string(),
  phoneNumber: z.string().optional(),

  // Subscription fields
  isPremium: z.boolean().default(false),
  subscriptionPlan: subscriptionPlanSchema.optional(),
  subscriptionIsActive: z.boolean().optional(),
  subscriptionStartDate: z.string().optional(),
  subscriptionEndDate: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripePriceId: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
