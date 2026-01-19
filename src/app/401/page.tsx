'use client'

import { useRouter } from 'next/navigation'
import { ErrorPage } from '@/components/error-page'

export default function Unauthorized() {
  const router = useRouter()

  return (
    <ErrorPage
      config={{
        code: '401',
        title: 'Authentication Required!',
        description: (
          <>
            You need to sign in to access this page. <br />
            Please log in with your account to continue.
          </>
        ),
        secondaryButton: {
          label: 'Go Back',
          onClick: () => router.back(),
        },
        primaryButton: {
          label: 'Sign In',
          onClick: () => router.push('/auth/sign-in'),
        },
      }}
    />
  )
}
