'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { DashboardSummary } from '@/components/dashboard/dashboard-summary'
import { DashboardSummarySkeleton } from '@/components/dashboard/dashboard-summary-skeleton'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton } from '@/components/data-table/table-skeleton'
import { getColumns } from './components/columns'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { BlogPost, PostStatus, getBlogPosts, BlogStats, getBlogStats } from './actions'
import { FileText, Plus, RefreshCw, Eye, File, Archive, Clock, Star, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

export default function BlogManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalCount, setTotalCount] = useState(0)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('')

  // Store current pagination in a ref to avoid stale closures
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

  // Track component mount
  const isMountedRef = useRef(false)

  // Track last fetched page to prevent duplicates
  const lastFetchedRef = useRef<string>('')

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getBlogStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching blog stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }
    fetchStats()
  }, [])

  const fetchPostsForPage = useCallback(async (pageIndex: number, pageSize: number, force = false) => {
    const fetchKey = `${pageIndex}-${pageSize}-${statusFilter}-${search}`
    const apiPage = pageIndex + 1

    // Skip if we just fetched this page (unless forced)
    if (!force && lastFetchedRef.current === fetchKey && posts.length > 0) {
      return
    }

    // Mark as fetching immediately to prevent duplicates
    // But reset first if forcing to allow the fetch
    if (force) {
      lastFetchedRef.current = ''
    }
    lastFetchedRef.current = fetchKey

    // Set loading state for initial load or page change
    setIsLoading(true)

    try {
      const result = await getBlogPosts({
        page: apiPage,
        limit: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setPosts(result.posts)
      setTotalCount(result.total)
    } catch (error) {
      console.error('Error fetching blog posts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch blog posts',
        variant: 'destructive',
      })
      // Reset on error so we can retry
      lastFetchedRef.current = ''
    } finally {
      setIsLoading(false)
    }
  }, [posts.length, search, statusFilter, toast])

  useEffect(() => {
    // Skip first render - let the initial fetch happen naturally
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchPostsForPage(pagination.pageIndex, pagination.pageSize)
      return
    }

    fetchPostsForPage(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, fetchPostsForPage])

  const refreshPosts = async () => {
    // Refresh both stats and posts
    setIsLoadingStats(true)
    try {
      const [statsData] = await Promise.all([
        getBlogStats(),
        fetchPostsForPage(paginationRef.current.pageIndex, paginationRef.current.pageSize, true)
      ])
      setStats(statsData)
    } catch (error) {
      console.error('Error refreshing:', error)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    fetchPostsForPage(0, pagination.pageSize, true)
  }

  const columns = useMemo(() => getColumns(refreshPosts), [refreshPosts])

  // Prepare summary items
  const summaryItems = useMemo(() => {
    if (!stats) return []

    return [
      {
        title: 'Total Posts',
        value: stats.totalPosts,
        description: 'All blog posts',
        icon: FileText,
      },
      {
        title: 'Published',
        value: stats.publishedPosts,
        description: 'Live posts',
        icon: File,
      },
      {
        title: 'Drafts',
        value: stats.draftPosts,
        description: 'Unpublished posts',
        icon: FileText,
      },
      {
        title: 'Scheduled',
        value: stats.scheduledPosts,
        description: 'Scheduled to publish',
        icon: Clock,
      },
      {
        title: 'Total Views',
        value: stats.totalViews.toLocaleString(),
        description: 'All time views',
        icon: Eye,
      },
      {
        title: 'Comments',
        value: stats.totalComments,
        description: 'Total comments',
        icon: MessageSquare,
      },
    ]
  }, [stats])

  return (
    <DashboardPage
      icon={FileText}
      title="Blog Posts"
      description="Manage your blog posts and content"
      actions={[
        {
          label: 'Create Post',
          icon: Plus,
          onClick: () => router.push('/dashboard/blog/new'),
        },
        {
          label: 'Refresh',
          icon: RefreshCw,
          onClick: refreshPosts,
          variant: 'outline',
        },
      ]}
    >
      {/* Dashboard Summary */}
      {isLoadingStats ? (
        <DashboardSummarySkeleton />
      ) : stats ? (
        <DashboardSummary summaries={summaryItems} />
      ) : null}

      {/* Filters */}
      <div className='mb-4 flex flex-col sm:flex-row gap-4'>
        <div className='flex-1 flex gap-2'>
          <Input
            placeholder='Search posts...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className='max-w-sm'
          />
          <Button onClick={handleSearch} variant='outline'>
            Search
          </Button>
        </div>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) => {
            setStatusFilter(value === 'all' ? '' : (value as PostStatus))
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='PUBLISHED'>Published</SelectItem>
            <SelectItem value='DRAFT'>Draft</SelectItem>
            <SelectItem value='SCHEDULED'>Scheduled</SelectItem>
            <SelectItem value='ARCHIVED'>Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rowCount={pagination.pageSize} />
      ) : posts.length === 0 ? (
        <EmptyStateCard
          icon={FileText}
          title='No blog posts found'
          description='Create your first blog post to get started with content creation.'
        />
      ) : (
        <DataTable
          data={posts}
          columns={columns}
          pagination={pagination}
          onPaginationChange={setPagination}
          totalCount={totalCount}
          onSelectedRowsChange={setSelectedRows}
        />
      )}
    </DashboardPage>
  )
}
