'use client'

import { Button } from '@/components/ui/button'
import {IconUserPlus } from "@tabler/icons-react";
import { useAuthorsContext } from '../context/authors-context'

export function AuthorsHeader() {
  const { setOpen } = useAuthorsContext()

  const handleAddAuthor = () => {
    setOpen('create')
  }

  return (
      <>
          <div>
              <h2 className='text-2xl font-bold tracking-tight'>Authors List</h2>
              <p className='text-muted-foreground'>
                  Manage authors in your library system
              </p>
          </div>
          <div className='flex gap-2'>
              <Button className='space-x-1' onClick={handleAddAuthor}>
                  <span>Add Author</span> <IconUserPlus size={18} />
              </Button>
          </div>
      </>
  )
}