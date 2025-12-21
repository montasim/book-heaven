'use client'

import { deletePublication, getPublications } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { PublicationsHeader } from './components/publications-header'
import { useEffect, useState } from 'react'
import { Publication } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import PublicationsContextProvider, { PublicationsDialogType } from './context/publications-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { PublicationsMutateDrawer } from './components/publications-mutate-drawer'
import { PublicationsDeleteDialog } from './components/publications-delete-dialog'

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([])

  useEffect(() => {
    const updatePublications = async () => {
      const rawPublications = await getPublications()
      setPublications(rawPublications)
    }

    updatePublications()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<Publication | null>(null)
  const [open, setOpen] = useDialogState<PublicationsDialogType>(null)

  const refreshPublications = async () => {
    try {
      const rawPublications = await getPublications()
      setPublications(rawPublications)
    } catch (error) {
      console.error('Error refreshing publications:', error)
    }
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
        <DataTable data={publications} columns={columns} />
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