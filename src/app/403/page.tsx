'use client'

import { useRouter } from 'next/navigation'
import { ErrorPage } from '@/components/error-page'

export default function Forbidden() {
  const router = useRouter()

  return (
    <ErrorPage
      config={{
        code: '403',
        title: 'Access Denied!',
        description: (
          <>
            You don&apos;t have permission to access this page. <br />
            This area is restricted to authorized users only.
          </>
        ),
        secondaryButton: {
          label: 'Go Back',
          onClick: () => router.back(),
        },
        primaryButton: {
          label: 'Go to Dashboard',
          onClick: () => router.push('/dashboard'),
        },
      }}
    />
  )
}
