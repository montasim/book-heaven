'use client'

import { Button } from '@/components/ui/button'
import { IconMailPlus, IconUserPlus } from '@tabler/icons-react'
import { useUsersContext } from '../context/users-context'

export function UsersHeaderActions() {
  const { setOpen } = useUsersContext()

  return (
    <>
      <Button variant='outline' size="sm" onClick={() => setOpen('invite')}>
        <IconMailPlus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Invite User</span>
      </Button>
      <Button size="sm" onClick={() => setOpen('create')}>
        <IconUserPlus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Add User</span>
      </Button>
    </>
  )
}
