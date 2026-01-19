'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { PublicHeader } from '@/components/layout/public-header'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export interface ErrorPageConfig {
  /** Error code to display (e.g., 404, 401, 403, 500) */
  code: string | number
  /** Title of the error */
  title: string
  /** Description of the error */
  description: ReactNode
  /** Primary button configuration */
  primaryButton: {
    label: string
    onClick: () => void
  }
  /** Secondary button configuration */
  secondaryButton?: {
    label: string
    onClick: () => void
  }
}

interface ErrorPageProps {
  config: ErrorPageConfig
}

export function ErrorPage({ config }: ErrorPageProps) {
  const { code, title, description, primaryButton, secondaryButton } = config

  return (
    <>
      <PublicHeader />
      <div className='min-h-screen'>
        <div className='m-auto flex h-svh w-full flex-col items-center justify-center gap-2'>
          <h1 className='text-[7rem] font-bold leading-tight'>{code}</h1>
          <span className='font-medium'>{title}</span>
          <p className='text-center text-muted-foreground'>
            {description}
          </p>
          <div className='mt-6 flex gap-4'>
            {secondaryButton && (
              <Button variant='outline' onClick={secondaryButton.onClick}>
                {secondaryButton.label}
              </Button>
            )}
            <Button onClick={primaryButton.onClick}>
              {primaryButton.label}
            </Button>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </>
  )
}
