'use client'

import { deletePublication, getPublications } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { PublicationsHeader } from './components/publications-header'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Publication } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import PublicationsContextProvider, { PublicationsDialogType } from './context/publications-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { PublicationsMutateDrawer } from './components/publications-mutate-drawer'
import { PublicationsDeleteDialog } from './components/publications-delete-dialog'
import { EmptyStateCard } from '@/components/ui/empty-state-card'

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalCount, setTotalCount] = useState(0)

  // Store current pagination in a ref to avoid stale closures
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

  // Track component mount
  const isMountedRef = useRef(false)

  // Track last fetched page to prevent duplicates
  const lastFetchedRef = useRef<string>('')

  const fetchPublicationsForPage = useCallback(async (pageIndex: number, pageSize: number) => {
    const fetchKey = `${pageIndex}-${pageSize}`
    const apiPage = pageIndex + 1

    // Skip if we just fetched this page
    if (lastFetchedRef.current === fetchKey) {
      return
    }

    // Mark as fetching immediately to prevent duplicates
    lastFetchedRef.current = fetchKey

    try {
      const result = await getPublications({
        page: apiPage,
        pageSize: pageSize,
      })
      setPublications(result.publications)
      setTotalCount(result.pagination.total)
    } catch (error) {
      console.error('Error fetching publications:', error)
      // Reset on error so we can retry
      lastFetchedRef.current = ''
    }
  }, [])

  useEffect(() => {
    // Skip first render - let the initial fetch happen naturally
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchPublicationsForPage(pagination.pageIndex, pagination.pageSize)
      return
    }

    fetchPublicationsForPage(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, fetchPublicationsForPage])

  // Local states
  const [currentRow, setCurrentRow] = useState<Publication | null>(null)
  const [open, setOpen] = useDialogState<PublicationsDialogType>(null)

  const refreshPublications = async () => {
    const { pageIndex, pageSize } = paginationRef.current
    await fetchPublicationsForPage(pageIndex, pageSize)
  }

  const handleDelete = async (publication: Publication) => {
    try {
      await deletePublication(publication.id)
      await refreshPublications()
      toast({
        title: 'The following publication has been deleted:',
        description: (
          <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <code className='text-white'>
              {JSON.stringify(publication, null, 2)}
            </code>
          </pre>
        ),
      })
      // Close the delete modal and clear the current row
      setOpen(null)
      setCurrentRow(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete publication',
        variant: 'destructive',
      })
    }
  }

  return (
    <PublicationsContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshPublications }}>
      <HeaderContainer>
        <PublicationsHeader />
      </HeaderContainer>

      <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
        {publications.length === 0 ? (
          <EmptyStateCard
            title='No publications found'
            description='There are no publications in the system yet. Create your first publication to get started.'
          />
        ) : (
          <DataTable
            data={publications}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
          />
        )}
      </div>

      <PublicationsMutateDrawer
        key='publication-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshPublications}
      />

      {currentRow && (
        <>
          <PublicationsMutateDrawer
            key={`publication-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshPublications}
          />

          <PublicationsDeleteDialog
            key='publication-delete'
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            onConfirm={() => handleDelete(currentRow)}
            publication={currentRow}
          />
        </>
      )}
    </PublicationsContextProvider>
  )
}