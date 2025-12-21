'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBooksContext } from '../context/books-context'

export function BooksHeader() {
  const { setOpen } = useBooksContext()

  const handleAddBook = () => {
    setOpen('create')
  }

  return (
      <>
          <div>
              <h2 className='text-2xl font-bold tracking-tight'>Books List</h2>
              <p className='text-muted-foreground'>
                  Manage books in your library system
              </p>
          </div>
          <div className='flex gap-2'>
              <Button className='space-x-1' onClick={handleAddBook}>
                  <span>Add Book</span> <Plus size={18} />
              </Button>
          </div>
      </>
  )
}