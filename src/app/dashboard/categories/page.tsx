'use client'

import { deleteCategory, getCategories } from './actions'
import { HeaderContainer } from '@/components/ui/header-container'
import { CategoriesHeader } from './components/categories-header'
import { useEffect, useState } from 'react'
import { Category } from './data/schema'
import useDialogState from '@/hooks/use-dialog-state'
import CategoriesContextProvider, { CategoriesDialogType } from './context/categories-context'
import { toast } from '@/hooks/use-toast'
import { DataTable } from '@/components/data-table/data-table'
import { columns } from './components/columns'
import { CategoriesMutateDrawer } from './components/categories-mutate-drawer'
import { CategoriesDeleteDialog } from './components/categories-delete-dialog'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const updateCategories = async () => {
      const rawCategories = await getCategories()
      setCategories(rawCategories)
    }

    updateCategories()
  }, [])

  // Local states
  const [currentRow, setCurrentRow] = useState<Category | null>(null)
  const [open, setOpen] = useDialogState<CategoriesDialogType>(null)

  const refreshCategories = async () => {
    try {
      const rawCategories = await getCategories()
      setCategories(rawCategories)
    } catch (error) {
      console.error('Error refreshing categories:', error)
    }
  }

  const handleDelete = async (category: Category) => {
    try {
      await deleteCategory(category.id)
      await refreshCategories()
      toast({
        title: 'The following category has been deleted:',
        description: (
          <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <code className='text-white'>
              {JSON.stringify(category, null, 2)}
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
        description: 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  return (
    <CategoriesContextProvider value={{ open, setOpen, currentRow, setCurrentRow, refreshCategories }}>
      <HeaderContainer>
        <CategoriesHeader />
      </HeaderContainer>

      <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
        <DataTable data={categories} columns={columns} />
      </div>

      <CategoriesMutateDrawer
        key='category-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
        onSuccess={refreshCategories}
      />

      {currentRow && (
        <>
          <CategoriesMutateDrawer
            key={`category-update-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
            onSuccess={refreshCategories}
          />

          <CategoriesDeleteDialog
            key='category-delete'
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            onConfirm={() => handleDelete(currentRow)}
            category={currentRow}
          />
        </>
      )}
    </CategoriesContextProvider>
  )
}