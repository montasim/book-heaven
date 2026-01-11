'use client'

import { Button } from '@/components/ui/button'
import { useCampaignsContext } from '../context/campaigns-context'
import { IconPlus } from '@tabler/icons-react'

export function CampaignsHeaderActions({ campaignCount }: { campaignCount: number }) {
  const { setOpen } = useCampaignsContext()

  return (
    <>
      <Button onClick={() => setOpen('create')} size="sm">
        <IconPlus className="h-4 w-4 mr-2" />
        <span className='hidden sm:inline'>New Campaign</span>
      </Button>
    </>
  )
}
