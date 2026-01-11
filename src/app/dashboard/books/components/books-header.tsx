'use client'

import { Plus, RefreshCw, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBooksContext } from '../context/books-context'
import { BulkImportDrawer } from './bulk-import-drawer'
import { useState } from 'react'
import { invalidateCache } from '../actions'
import { toast } from 'sonner'

export function BooksHeaderActions() {
  const { setOpen, refreshBooks } = useBooksContext()
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [isInvalidating, setIsInvalidating] = useState(false)

  const handleAddBook = () => {
    setOpen('create')
  }

  const handleInvalidateCache = async () => {
    setIsInvalidating(true)
    try {
      await invalidateCache()
      toast.success('Books cache invalidated successfully')
      await refreshBooks?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to invalidate cache')
    } finally {
      setIsInvalidating(false)
    }
  }

  return (
    <>
      <Button onClick={handleAddBook} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Add Book</span>
      </Button>
      <Button onClick={() => setBulkImportOpen(true)} variant='outline' size='icon' className='sm:hidden'>
        <Upload className="h-4 w-4" />
      </Button>
      <Button onClick={() => setBulkImportOpen(true)} variant='outline' size="sm" className='hidden sm:flex'>
        <Upload className="h-4 w-4 mr-2" />
        Bulk Import
      </Button>
      <Button onClick={() => refreshBooks?.()} variant='outline' size='icon' className='sm:hidden'>
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Button onClick={() => refreshBooks?.()} variant='outline' size="sm" className='hidden sm:flex'>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <Button
        onClick={handleInvalidateCache}
        variant='outline'
        disabled={isInvalidating}
        size='icon'
        className='sm:hidden'
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        onClick={handleInvalidateCache}
        variant='outline'
        disabled={isInvalidating}
        size="sm"
        className='hidden sm:flex'
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isInvalidating ? 'Invalidating...' : 'Invalidate Cache'}
      </Button>

      <BulkImportDrawer
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onSuccess={() => refreshBooks?.()}
      />
    </>
  )
}
