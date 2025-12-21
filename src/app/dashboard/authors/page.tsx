'use client'

import { deleteAuthor, getAuthors } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { AuthorsHeader } from './components/authors-header'
import { useEffect, useState } from 'react'
import { Author } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import AuthorsContextProvider, { AuthorsDialogType } from './context/authors-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { AuthorsMutateDrawer } from './components/authors-mutate-drawer'
import { AuthorsDeleteDialog } from './components/authors-delete-dialog'

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([])

  useEffect(() => {
    const updateAuthors = async () => {
      const rawAuthors = await getAuthors()
      setAuthors(rawAuthors)
    }

    updateAuthors()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<Author | null>(null)
  const [open, setOpen] = useDialogState<AuthorsDialogType>(null)

  const refreshAuthors = async () => {
    try {
      const rawAuthors = await getAuthors()
      setAuthors(rawAuthors)
    } catch (error) {
      console.error('Error refreshing authors:', error)
    }
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
        <DataTable data={authors} columns={columns} />
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