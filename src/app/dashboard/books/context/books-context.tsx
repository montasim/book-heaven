'use client'

import React from 'react'
import { Book } from '../data/schema'

export type BooksDialogType = 'create' | 'edit' | 'delete'

interface BooksContextType {
  open: BooksDialogType | null
  setOpen: (str: BooksDialogType | null) => void
  currentRow: Book | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Book | null>>
  refreshBooks?: () => Promise<void>
}

const BooksContext = React.createContext<BooksContextType | null>(null)

interface Props {
  children: React.ReactNode
  value: BooksContextType
}

export default function BooksContextProvider({ children, value }: Props) {
  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>
}

export const useBooksContext = () => {
  const booksContext = React.useContext(BooksContext)

  if (!booksContext) {
    throw new Error(
      'useBooksContext has to be used within <BooksContext.Provider>'
    )
  }

  return booksContext
}