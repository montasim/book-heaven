'use client'

import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLoansContext } from '../context/loans-context'

interface LoansHeaderActionsProps {
  onLendBook?: () => void
}

export function LoansHeaderActions({ onLendBook }: LoansHeaderActionsProps) {
  const { refreshLoans } = useLoansContext()

  return (
    <>
      {onLendBook && (
        <Button onClick={onLendBook} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          <span className='hidden sm:inline'>Lend Book</span>
        </Button>
      )}
      <Button onClick={refreshLoans} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>Refresh</span>
      </Button>
    </>
  )
}
