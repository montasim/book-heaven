'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicationsContext } from '../context/publications-context'

export function PublicationsHeader() {
  const { setOpen } = usePublicationsContext()

  const handleAddPublication = () => {
    setOpen('create')
  }

  return (
      <>
          <div>
              <h2 className='text-2xl font-bold tracking-tight'>Publication List</h2>
              <p className='text-muted-foreground'>
                  Manage publications in your library system
              </p>
          </div>
          <div className='flex gap-2'>
              <Button className='space-x-1' onClick={handleAddPublication}>
                  <span>Add Publication</span> <Plus size={18} />
              </Button>
          </div>
      </>
  )
}