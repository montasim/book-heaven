'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCategoriesContext } from '../context/categories-context'

export function CategoriesHeader() {
  const { setOpen } = useCategoriesContext()

  const handleAddCategory = () => {
    setOpen('create')
  }

  return (
      <>
          <div>
              <h2 className='text-2xl font-bold tracking-tight'>Category List</h2>
              <p className='text-muted-foreground'>
                  Manage categories in your library system
              </p>
          </div>
          <div className='flex gap-2'>
              <Button className='space-x-1' onClick={handleAddCategory}>
                  <span>Add Category</span> <Plus size={18} />
              </Button>
          </div>
      </>
  )
}