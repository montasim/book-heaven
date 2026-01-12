'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Translator } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  translator: Translator
}

export function TranslatorsDeleteDialog({ open, onOpenChange, onConfirm, translator }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Translator"
      desc={
        <>
          Are you sure you want to delete the translator <strong>&quot;{translator.name}&quot;</strong>?
          This action cannot be undone.
        </>
      }
      cancelBtnText="Cancel"
      confirmText="Delete"
      destructive
      handleConfirm={onConfirm}
    />
  )
}
