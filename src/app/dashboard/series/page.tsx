'use client'

import { getSeries } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { SeriesHeader } from './components/series-header'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Series } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { SeriesMutateDrawer } from './components/series-mutate-drawer'
import { SeriesDeleteDialog } from './components/series-delete-dialog'
import SeriesProvider, { useSeriesContext, SeriesDialogType } from './context/series-context'
import { EmptyStateCard } from '@/components/ui/empty-state-card'

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalCount, setTotalCount] = useState(0)

  // Store current pagination in a ref to avoid stale closures
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

  // Track component mount
  const isMountedRef = useRef(false)

  // Track last fetched page to prevent duplicates
  const lastFetchedRef = useRef<string>('')

  const fetchSeriesForPage = useCallback(async (pageIndex: number, pageSize: number) => {
    const fetchKey = `${pageIndex}-${pageSize}`
    const apiPage = pageIndex + 1

    // Skip if we just fetched this page
    if (lastFetchedRef.current === fetchKey) {
      return
    }

    // Mark as fetching immediately to prevent duplicates
    lastFetchedRef.current = fetchKey

    try {
      const result = await getSeries({
        page: apiPage,
        pageSize: pageSize,
      })
      setSeries(result.series)
      setTotalCount(result.pagination.total)
    } catch (error) {
      console.error('Error fetching series:', error)
      // Reset on error so we can retry
      lastFetchedRef.current = ''
      toast({
        title: 'Error',
        description: 'Failed to load series',
        variant: 'destructive',
      })
    }
  }, [])

  useEffect(() => {
    // Skip first render - let the initial fetch happen naturally
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchSeriesForPage(pagination.pageIndex, pagination.pageSize)
      return
    }

    fetchSeriesForPage(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, fetchSeriesForPage])

  // Local states
  const [currentRow, setCurrentRow] = useState<Series | null>(null)
  const [open, setOpen] = useDialogState<SeriesDialogType>(null)

  const refreshSeries = async () => {
    const { pageIndex, pageSize } = paginationRef.current
    await fetchSeriesForPage(pageIndex, pageSize)
  }

  return (
    <SeriesProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshSeries }}>
      <HeaderContainer>
        <SeriesHeader />
      </HeaderContainer>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
        {series.length === 0 ? (
          <EmptyStateCard
            title='No series found'
            description='There are no series in the system yet. Create your first series to get started.'
          />
        ) : (
          <DataTable
            data={series}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
          />
        )}
      </div>

      <SeriesMutateDrawer
        key="series-create"
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshSeries}
      />

      {currentRow && (
        <>
          <SeriesMutateDrawer
            key={`series-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshSeries}
          />

          <SeriesDeleteDialog
            key="series-delete"
            series={currentRow}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen(null)
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
          />
        </>
      )}
    </SeriesProvider>
  )
}
