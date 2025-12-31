'use client'

import { createContext, useContext } from 'react'
import type { Loan } from '../data/schema'

export type LoansDialogType = 'view' | null

interface LoansContextType {
  open: LoansDialogType
  setOpen: (value: LoansDialogType) => void
  currentRow: Loan | null
  setCurrentRow: (row: Loan | null) => void
  refreshLoans: () => Promise<void>
}

const LoansContext = createContext<LoansContextType | undefined>(undefined)

export function useLoansContext() {
  const context = useContext(LoansContext)
  if (!context) {
    throw new Error('useLoansContext must be used within a LoansProvider')
  }
  return context
}

export function LoansProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: LoansContextType
}) {
  return <LoansContext.Provider value={value}>{children}</LoansContext.Provider>
}
