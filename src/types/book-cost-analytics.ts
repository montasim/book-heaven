import { BookType } from '@prisma/client'

// ============================================================================
// CORE TYPES
// ============================================================================

export type DateRangeType = '7d' | '30d' | '90d' | 'all'
export type GroupByType = 'category' | 'author' | 'publication' | 'timePeriod'
export type TimePeriodGrouping = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface CostAnalyticsQuery {
  dateRange: DateRangeType
  groupBy?: GroupByType
  timePeriod?: TimePeriodGrouping
  startDate?: Date
  endDate?: Date
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface CostAnalyticsData {
  summary: CostSummary
  costsOverTime: CostOverTimeData[]
  costsByDimension: CostByDimensionData[]
  topCosts: TopCostItem[]
  activitySummary: CostActivitySummary
  detailedBreakdown: CostDetailItem[]
}

export interface CostSummary {
  totalBooks: number
  totalSpent: number
  averageCostPerBook: number
  hardCopyCount: number
  hardCopySpent: number
  averageHardCopyCost: number
  mostExpensiveBook: number
  leastExpensiveBook: number
}

export interface CostOverTimeData {
  period: string
  displayPeriod: string
  totalCost: number
  bookCount: number
  averageCost: number
}

export interface CostByDimensionData {
  id: string
  name: string
  totalCost: number
  bookCount: number
  averageCost: number
  // For category/author/publication
  category?: {
    id: string
    name: string
    image?: string | null
    directImageUrl?: string | null
  }
  author?: {
    id: string
    name: string
    image?: string | null
    directImageUrl?: string | null
  }
  publication?: {
    id: string
    name: string
    image?: string | null
    directImageUrl?: string | null
  }
}

export interface TopCostItem {
  bookId: string
  bookName: string
  bookType: BookType
  totalCost: number
  buyingPrice: number
  numberOfCopies: number
  purchaseDate: Date | null
  image?: string | null
  directImageUrl?: string | null
}

export interface CostActivitySummary {
  spentToday: number
  spentThisWeek: number
  spentThisMonth: number
  booksAddedToday: number
  booksAddedThisWeek: number
  booksAddedThisMonth: number
}

export interface CostDetailItem {
  bookId: string
  bookName: string
  bookType: BookType
  buyingPrice: number | null
  numberOfCopies: number | null
  totalCost: number
  purchaseDate: Date | null
  authors: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
  publications: Array<{ id: string; name: string }>
  entryById: string
  entryBy?: {
    id: string
    name: string
    firstName?: string | null
    lastName?: string | null
  }
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CostAnalyticsResponse {
  success: boolean
  data?: CostAnalyticsData
  message?: string
  error?: string
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

export interface ChartDataPoint {
  label: string
  value: number
  count?: number
  date?: Date
}

export interface FormattedCostData {
  period: string
  cost: number
  count: number
  average: number
}
