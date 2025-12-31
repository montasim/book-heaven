'use client'

import { deleteAuthor, getAuthors } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { AuthorsHeader } from './components/authors-header'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Author } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import AuthorsContextProvider, { AuthorsDialogType } from './context/authors-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { AuthorsMutateDrawer } from './components/authors-mutate-drawer'
import { AuthorsDeleteDialog } from './components/authors-delete-dialog'
import { EmptyStateCard } from '@/components/ui/empty-state-card'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [totalCount, setTotalCount] = useState(0)

  // Store current pagination in a ref to avoid stale closures
  const paginationRef = useRef(pagination)
  paginationRef.current = pagination

  // Track component mount
  const isMountedRef = useRef(false)

  // Track last fetched page to prevent duplicates
  const lastFetchedRef = useRef<string>('')

  const fetchAuthorsForPage = useCallback(async (pageIndex: number, pageSize: number) => {
    const fetchKey = `${pageIndex}-${pageSize}`
    const apiPage = pageIndex + 1

    // Skip if we just fetched this page
    if (lastFetchedRef.current === fetchKey) {
      return
    }

    // Mark as fetching immediately to prevent duplicates
    lastFetchedRef.current = fetchKey

    try {
      const result = await getAuthors({
        page: apiPage,
        pageSize: pageSize,
      })
      setAuthors(result.authors)
      setTotalCount(result.pagination.total)
    } catch (error) {
      console.error('Error fetching authors:', error)
      // Reset on error so we can retry
      lastFetchedRef.current = ''
    }
  }, [])

  useEffect(() => {
    // Skip first render - let the initial fetch happen naturally
    if (!isMountedRef.current) {
      isMountedRef.current = true
      fetchAuthorsForPage(pagination.pageIndex, pagination.pageSize)
      return
    }

    fetchAuthorsForPage(pagination.pageIndex, pagination.pageSize)
  }, [pagination.pageIndex, pagination.pageSize, fetchAuthorsForPage])

  // Local states
  const [currentRow, setCurrentRow] = useState<Author | null>(null)
  const [open, setOpen] = useDialogState<AuthorsDialogType>(null)

  const refreshAuthors = async () => {
    const { pageIndex, pageSize } = paginationRef.current
    await fetchAuthorsForPage(pageIndex, pageSize)
  }

  const handleDelete = async (author: Author) => {
    try {
      await deleteAuthor(author.id)
      await refreshAuthors()
      toast({
        title: 'The following author has been deleted:',
        description: (
          <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <code className='text-white'>
              {JSON.stringify(author, null, 2)}
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
        description: 'Failed to delete author',
        variant: 'destructive',
      })
    }
  }

  return (
    <AuthorsContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshAuthors }}>
      <HeaderContainer>
        <AuthorsHeader />
      </HeaderContainer>

      <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
        {authors.length === 0 ? (
          <EmptyStateCard
            title='No authors found'
            description='There are no authors in the system yet. Create your first author to get started.'
          />
        ) : (
          <DataTable
            data={authors}
            columns={columns}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
          />
        )}
      </div>

      <AuthorsMutateDrawer
        key='author-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshAuthors}
      />

      {currentRow && (
        <>
          <AuthorsMutateDrawer
            key={`author-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshAuthors}
          />

          <AuthorsDeleteDialog
            key='author-delete'
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            onConfirm={() => handleDelete(currentRow)}
            author={currentRow}
          />
        </>
      )}
    </AuthorsContextProvider>
  )
}