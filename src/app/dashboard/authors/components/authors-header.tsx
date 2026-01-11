'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconUserPlus } from "@tabler/icons-react";
import { useAuthorsContext } from '../context/authors-context'

export function AuthorsHeaderActions() {
  const { setOpen, refreshAuthors } = useAuthorsContext()

  const handleAddAuthor = () => {
    setOpen('create')
  }

  return (
    <div className='space-x-4'>
      <Button onClick={handleAddAuthor} size="sm">
        <IconUserPlus className="h-4 w-4" />
        <span className='hidden sm:inline'>Add Author</span>
      </Button>
      <Button onClick={refreshAuthors} variant='outline' size="sm">
        <RefreshCw className="h-4 w-4" />
        <span className='hidden sm:inline'>Refresh</span>
      </Button>
    </div>
  )
}
