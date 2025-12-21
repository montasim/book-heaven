'use client'

import React from 'react'
import { Publication } from '../data/schema'

export type PublicationsDialogType = 'create' | 'edit' | 'delete'

interface PublicationsContextType {
  open: PublicationsDialogType | null
  setOpen: (str: PublicationsDialogType | null) => void
  currentRow: Publication | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Publication | null>>
  refreshPublications?: () => Promise<void>
}

const PublicationsContext = React.createContext<PublicationsContextType | null>(null)

interface Props {
  children: React.ReactNode
  value: PublicationsContextType
}

export default function PublicationsContextProvider({ children, value }: Props) {
  return <PublicationsContext.Provider value={value}>{children}</PublicationsContext.Provider>
}

export const usePublicationsContext = () => {
  const publicationsContext = React.useContext(PublicationsContext)

  if (!publicationsContext) {
    throw new Error(
      'usePublicationsContext has to be used within <PublicationsContext.Provider>'
    )
  }

  return publicationsContext
}