'use client'

import { Plus, RefreshCw, Sprout } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMoodsContext } from '../context/moods-context'

interface MoodsHeaderActionsProps {
  onSeedMoods?: () => void
}

export function MoodsHeaderActions({ onSeedMoods }: MoodsHeaderActionsProps) {
  const { setOpen, refreshMoods } = useMoodsContext()

  const handleAddMood = () => {
    setOpen('create')
  }

  return (
    <>
      <Button onClick={handleAddMood} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Add Mood</span>
      </Button>
      <Button onClick={refreshMoods} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Refresh</span>
      </Button>
      {onSeedMoods && (
        <Button onClick={onSeedMoods} variant="outline" size="sm">
          <Sprout className="h-4 w-4 mr-2" />
          <span className='hidden sm:inline'>Seed Moods</span>
        </Button>
      )}
    </>
  )
}
