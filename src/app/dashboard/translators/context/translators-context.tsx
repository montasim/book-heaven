'use client'

import React from 'react'
import { Translator } from '../data/schema'

export type TranslatorsDialogType = 'create' | 'edit' | 'delete'

interface TranslatorsContextType {
  open: TranslatorsDialogType | null
  setOpen: (str: TranslatorsDialogType | null) => void
  currentRow: Translator | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Translator | null>>
  refreshTranslators?: () => Promise<void>
}

const TranslatorsContext = React.createContext<TranslatorsContextType | null>(null)

interface Props {
  children: React.ReactNode
  value: TranslatorsContextType
}

export default function TranslatorsContextProvider({ children, value }: Props) {
  return <TranslatorsContext.Provider value={value}>{children}</TranslatorsContext.Provider>
}

export const useTranslatorsContext = () => {
  const translatorsContext = React.useContext(TranslatorsContext)

  if (!translatorsContext) {
    throw new Error(
      'useTranslatorsContext has to be used within <TranslatorsContext.Provider>'
    )
  }

  return translatorsContext
}
