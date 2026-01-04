import { prisma } from '@/lib/prisma'
import { PricingTier, PricingFeature, SubscriptionPlan } from '@prisma/client'

export type PricingTierWithFeatures = PricingTier & {
  features: PricingFeature[]
}

/**
 * Get all active pricing tiers with their features
 */
export async function getActivePricingTiers(): Promise<PricingTierWithFeatures[]> {
  return await prisma.pricingTier.findMany({
    where: { isActive: true },
    include: { features: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })
}

/**
 * Get a pricing tier by plan type
 */
export async function getPricingTierByPlan(
  plan: SubscriptionPlan
): Promise<PricingTierWithFeatures | null> {
  return await prisma.pricingTier.findUnique({
    where: { plan },
    include: { features: { orderBy: { order: 'asc' } } },
  })
}

/**
 * Get all pricing tiers (including inactive)
 */
export async function getAllPricingTiers(): Promise<PricingTierWithFeatures[]> {
  return await prisma.pricingTier.findMany({
    include: { features: { orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  })
}

/**
 * Create or update a pricing tier
 */
export async function upsertPricingTier(
  plan: SubscriptionPlan,
  data: {
    name: string
    description: string
    monthlyPrice: number
    yearlyPrice: number
    popular: boolean
    stripeMonthlyPriceId?: string
    stripeYearlyPriceId?: string
    isActive: boolean
    order: number
    features: { text: string; included: boolean; order: number }[]
  }
): Promise<PricingTierWithFeatures> {
  // Upsert the pricing tier
  const tier = await prisma.pricingTier.upsert({
    where: { plan },
    update: {
      name: data.name,
      description: data.description,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      popular: data.popular,
      stripeMonthlyPriceId: data.stripeMonthlyPriceId,
      stripeYearlyPriceId: data.stripeYearlyPriceId,
      isActive: data.isActive,
      order: data.order,
    },
    create: {
      plan,
      name: data.name,
      description: data.description,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      popular: data.popular,
      stripeMonthlyPriceId: data.stripeMonthlyPriceId,
      stripeYearlyPriceId: data.stripeYearlyPriceId,
      isActive: data.isActive,
      order: data.order,
    },
  })

  // Delete existing features
  await prisma.pricingFeature.deleteMany({
    where: { tierId: tier.id },
  })

  // Create new features
  await prisma.pricingFeature.createMany({
    data: data.features.map((feature) => ({
      tierId: tier.id,
      text: feature.text,
      included: feature.included,
      order: feature.order,
    })),
  })

  // Return the updated tier with features
  return await prisma.pricingTier.findUniqueOrThrow({
    where: { id: tier.id },
    include: { features: { orderBy: { order: 'asc' } } },
  })
}

/**
 * Delete a pricing tier
 */
export async function deletePricingTier(plan: SubscriptionPlan): Promise<void> {
  await prisma.pricingTier.delete({
    where: { plan },
  })
}

/**
 * Update pricing tier active status
 */
export async function updatePricingTierStatus(
  plan: SubscriptionPlan,
  isActive: boolean
): Promise<PricingTier> {
  return await prisma.pricingTier.update({
    where: { plan },
    data: { isActive },
  })
}
