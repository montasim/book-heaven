'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardSummarySkeleton } from '@/components/data-table/table-skeleton'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardPageHeaderActions } from '@/components/dashboard/dashboard-page-header-actions'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from 'recharts'
import {
    ShoppingBag,
    TrendingUp,
    Users,
    MessageSquare,
    Star,
    ArrowRight,
    Package,
    DollarSign,
    Activity,
    BarChart3,
    Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes/client-routes'

// ============================================================================
// TYPES
// ============================================================================

interface AnalyticsData {
    overview: {
        totalPosts: number
        activePosts: number
        soldPosts: number
        totalValue: number
        totalOffers: number
        acceptedOffers: number
        totalConversations: number
        totalReviews: number
        averageRating: number
    }
    postsOverTime: Array<{ createdAt: Date; _count: { id: number } }>
    salesOverTime: Array<{ soldAt: Date; _count: { id: number }; _sum: { price: number | null } }>
    topSellers: Array<{
        sellerId: string
        _count: { id: number }
        _sum: { price: number | null }
        user?: {
            id: string
            name: string
            firstName?: string | null
            lastName?: string | null
            avatar?: string | null
            directAvatarUrl?: any
        }
    }>
    activitySummary: {
        posts: {
            today: number
            thisWeek: number
            thisMonth: number
        }
        sales: {
            today: number
            thisWeek: number
            thisMonth: number
        }
        users: {
            newToday: number
            activeThisWeek: number
        }
    }
}

interface AnalyticsResponse {
    success: boolean
    data: AnalyticsData
    message?: string
}

type DateRange = '7d' | '30d' | '90d'

// ============================================================================
// COMPONENTS
// ============================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
                <p className="font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// ============================================================================
// PAGE
// ============================================================================

export default function AdminMarketplacePage() {
    const { user } = useAuth()
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [dateRange, setDateRange] = useState<DateRange>('30d')

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true)
            try {
                const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30
                const response = await fetch(`/api/admin/marketplace/analytics?days=${days}`)
                const result: AnalyticsResponse = await response.json()

                if (result.success) {
                    setAnalytics(result.data)
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAnalytics()
    }, [dateRange])

    // Format posts over time data for chart
    const formatPostsData = () => {
        if (!analytics?.postsOverTime) return []

        return analytics.postsOverTime.map((item) => {
            const date = new Date(item.createdAt)
            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                posts: item._count.id,
            }
        })
    }

    // Format sales over time data for chart
    const formatSalesData = () => {
        if (!analytics?.salesOverTime) return []

        return analytics.salesOverTime.map((item) => {
            const date = new Date(item.soldAt)
            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                sales: item._count.id,
                revenue: item._sum.price || 0,
            }
        })
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">Admin access required</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <DashboardPage
            icon={ShoppingBag}
            title="Marketplace Overview"
            description="Monitor and manage the peer-to-peer book marketplace"
            actions={
                <DashboardPageHeaderActions
                    actions={[
                        {
                            label: '7 Days',
                            icon: Calendar,
                            onClick: () => setDateRange('7d'),
                            variant: dateRange === '7d' ? 'default' : 'outline',
                        },
                        {
                            label: '30 Days',
                            icon: Calendar,
                            onClick: () => setDateRange('30d'),
                            variant: dateRange === '30d' ? 'default' : 'outline',
                        },
                        {
                            label: '90 Days',
                            icon: Calendar,
                            onClick: () => setDateRange('90d'),
                            variant: dateRange === '90d' ? 'default' : 'outline',
                        },
                    ]}
                />
            }
        >
            {isLoading ? (
                <>
                    {/* All Stats Skeleton */}
                    <DashboardSummarySkeleton count={7} />

                    {/* Charts Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[250px] w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[250px] w-full" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Activity Stats Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-12" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-28" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-5 w-12" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Sellers Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div>
                                                <Skeleton className="h-5 w-40 mb-2" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Skeleton className="h-5 w-20 mb-1" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Card key={i}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-lg" />
                                                <div className="flex-1">
                                                    <Skeleton className="h-5 w-24 mb-2" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                                <Skeleton className="h-4 w-4" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : analytics && (
                <>
                    {/* All Stats */}
                    <DashboardSummary
                        summaries={[
                            {
                                title: 'Active Listings',
                                value: analytics.overview.activePosts.toString(),
                                description: `${analytics.overview.totalPosts} total listings`,
                                icon: ShoppingBag,
                            },
                            {
                                title: 'Items Sold',
                                value: analytics.overview.soldPosts.toString(),
                                description: analytics.activitySummary.sales.thisWeek > 0
                                    ? `+${analytics.activitySummary.sales.thisWeek} this week`
                                    : 'No sales this week',
                                icon: Package,
                            },
                            {
                                title: 'Total Value',
                                value: `$${analytics.overview.totalValue.toLocaleString()}`,
                                description: 'Across all listings',
                                icon: DollarSign,
                            },
                            {
                                title: 'Avg Rating',
                                value: analytics.overview.averageRating.toFixed(1),
                                description: `${analytics.overview.totalReviews} reviews`,
                                icon: Star,
                            },
                            {
                                title: 'Total Offers',
                                value: analytics.overview.totalOffers.toString(),
                                description: `${analytics.overview.acceptedOffers} accepted (${analytics.overview.totalOffers > 0
                                    ? Math.round((analytics.overview.acceptedOffers / analytics.overview.totalOffers) * 100)
                                    : 0}%)`,
                                icon: TrendingUp,
                            },
                            {
                                title: 'Conversations',
                                value: analytics.overview.totalConversations.toString(),
                                description: 'Between buyers and sellers',
                                icon: MessageSquare,
                            },
                            {
                                title: 'Active Users',
                                value: (analytics.activitySummary as any).users?.activeThisWeek?.toString() ?? '-',
                                description: 'Active this week',
                                icon: Users,
                            },
                        ]}
                    />

                    {/* Activity Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CollapsibleSection title="Listing Activity" icon={BarChart3}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Today</span>
                                    <span className="font-semibold">{analytics.activitySummary.posts.today}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Week</span>
                                    <span className="font-semibold">{analytics.activitySummary.posts.thisWeek}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Month</span>
                                    <span className="font-semibold">{analytics.activitySummary.posts.thisMonth}</span>
                                </div>
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Sales Activity" icon={Activity}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Today</span>
                                    <span className="font-semibold">{analytics.activitySummary.sales.today}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Week</span>
                                    <span className="font-semibold">{analytics.activitySummary.sales.thisWeek}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Month</span>
                                    <span className="font-semibold">{analytics.activitySummary.sales.thisMonth}</span>
                                </div>
                            </div>
                        </CollapsibleSection>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Posts Over Time */}
                        <CollapsibleSection title="Posts Over Time" icon={BarChart3}>
                            <CardContent className="p-0">
                                {(() => {
                                    const postsData = formatPostsData()
                                    return postsData.length === 0 ? (
                                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                            No data yet
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <AreaChart data={postsData}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#888888"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#888888"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="posts"
                                                    stroke="hsl(var(--primary))"
                                                    fill="hsl(var(--primary))"
                                                    fillOpacity={0.2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )
                                })()}
                            </CardContent>
                        </CollapsibleSection>

                        {/* Sales Over Time */}
                        <CollapsibleSection title="Sales & Revenue Over Time" icon={Activity}>
                            <CardContent className="p-0">
                                {(() => {
                                    const salesData = formatSalesData()
                                    return salesData.length === 0 ? (
                                        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                            No data yet
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={salesData}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#888888"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#888888"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                                <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales" />
                                                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" name="Revenue ($)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )
                                })()}
                            </CardContent>
                        </CollapsibleSection>
                    </div>

                    {/* Top Sellers */}
                    {analytics.topSellers.length > 0 && (
                        <CollapsibleSection title="Top Sellers" icon={TrendingUp}>
                            <div className="space-y-4">
                                {analytics.topSellers.slice(0, 10).map((seller, index) => (
                                    <div key={seller.sellerId} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-semibold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {seller.user?.firstName && seller.user?.lastName
                                                        ? `${seller.user.firstName} ${seller.user.lastName}`
                                                        : seller.user?.name || 'Unknown'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {seller._count.id} items sold
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-primary">
                                                ${seller._sum.price?.toLocaleString() || 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground">total value</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Quick Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Marketplace Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link href={ROUTES.marketplacePosts.href}>
                                    <Card className="transition-all hover:shadow-md hover:border-primary cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Sell Posts</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Manage listings
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>

                                <Link href={ROUTES.marketplaceConversations.href}>
                                    <Card className="transition-all hover:shadow-md hover:border-primary cursor-pointer">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <MessageSquare className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Conversations</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Monitor messages
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </DashboardPage>
    )
}
