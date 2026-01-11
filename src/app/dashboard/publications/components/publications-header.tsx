'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicationsContext } from '../context/publications-context'

export function PublicationsHeaderActions() {
  const { setOpen, refreshPublications } = usePublicationsContext()

  const handleAddPublication = () => {
    setOpen('create')
  }

  return (
    <>
      <Button onClick={handleAddPublication} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Add Publication</span>
      </Button>
      <Button onClick={refreshPublications} variant='outline' size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Refresh</span>
      </Button>
    </>
  )
}
