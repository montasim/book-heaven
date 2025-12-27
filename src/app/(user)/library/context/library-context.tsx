'use client'

import { createContext, useContext, Dispatch, SetStateAction } from 'react'

export type LibraryDialogType = 'edit' | 'delete'

interface LibraryContextProps {
  open: LibraryDialogType | null
  setOpen: (value: LibraryDialogType | null) => void
  currentRow: any | null
  setCurrentRow: (value: any | null) => void
  refreshBooks: () => void
}

export const LibraryContext = createContext<LibraryContextProps | undefined>(undefined)

export function useLibraryContext() {
  const context = useContext(LibraryContext)
  if (!context) {
    throw new Error('useLibraryContext must be used within a LibraryContextProvider')
  }
  return context
}

export default LibraryContext.Provider
