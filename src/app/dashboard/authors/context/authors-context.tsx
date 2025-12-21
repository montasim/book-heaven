'use client'

import React from 'react'
import { Author } from '../data/schema'

export type AuthorsDialogType = 'create' | 'edit' | 'delete'

interface AuthorsContextType {
  open: AuthorsDialogType | null
  setOpen: (str: AuthorsDialogType | null) => void
  currentRow: Author | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Author | null>>
  refreshAuthors?: () => Promise<void>
}

const AuthorsContext = React.createContext<AuthorsContextType | null>(null)

interface Props {
  children: React.ReactNode
  value: AuthorsContextType
}

export default function AuthorsContextProvider({ children, value }: Props) {
  return <AuthorsContext.Provider value={value}>{children}</AuthorsContext.Provider>
}

export const useAuthorsContext = () => {
  const authorsContext = React.useContext(AuthorsContext)

  if (!authorsContext) {
    throw new Error(
      'useAuthorsContext has to be used within <AuthorsContext.Provider>'
    )
  }

  return authorsContext
}