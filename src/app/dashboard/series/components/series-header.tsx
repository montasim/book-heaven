'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useSeriesContext } from '../context/series-context'
import { useAuth } from '@/context/auth-context'

export function SeriesHeaderActions() {
  const { user } = useAuth()
  const { setOpen } = useSeriesContext()

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  if (!canCreate) return null

  return (
    <>
      <Button onClick={() => setOpen('create')} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Add Series</span>
      </Button>
    </>
  )
}
