'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNoticesContext } from '../context/notices-context'

export function NoticesHeaderActions() {
  const { setOpen, refreshNotices } = useNoticesContext()

  const handleAddNotice = () => {
    setOpen('create')
  }

  return (
    <>
      <Button onClick={handleAddNotice} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Add Notice</span>
      </Button>
      <Button onClick={refreshNotices} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Refresh</span>
      </Button>
    </>
  )
}
