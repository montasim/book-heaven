'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCategoriesContext } from '../context/categories-context'

export function CategoriesHeaderActions() {
  const { setOpen, refreshCategories } = useCategoriesContext()

  const handleAddCategory = () => {
    setOpen('create')
  }

  return (
    <>
      <Button onClick={handleAddCategory} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Add Category</span>
      </Button>
      <Button onClick={refreshCategories} variant='outline' size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Refresh</span>
      </Button>
    </>
  )
}
