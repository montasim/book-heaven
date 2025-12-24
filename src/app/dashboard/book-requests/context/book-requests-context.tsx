'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { BookRequest } from '../data/schema'

type BookRequestsDialogType = 'view' | 'status' | null

interface BookRequestsContextValue {
  open: BookRequestsDialogType
  setOpen: (dialog: BookRequestsDialogType) => void
  currentRow: BookRequest | null
  setCurrentRow: (row: BookRequest | null) => void
}

const BookRequestsContext = createContext<BookRequestsContextValue | undefined>(undefined)

export function BookRequestsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<BookRequestsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<BookRequest | null>(null)

  return (
    <BookRequestsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </BookRequestsContext.Provider>
  )
}

export function useBookRequestsContext() {
  const context = useContext(BookRequestsContext)
  if (!context) {
    throw new Error('useBookRequestsContext must be used within BookRequestsProvider')
  }
  return context
}
