'use client'

import { useRouter } from 'next/navigation'
import { ErrorPage } from '@/components/error-page'

export default function NotFound() {
  const router = useRouter()

  return (
    <ErrorPage
      config={{
        code: '404',
        title: 'Oops! Page Not Found!',
        description: (
          <>
            It seems like the page you&apos;re looking for <br />
            does not exist or might have been removed.
          </>
        ),
        secondaryButton: {
          label: 'Go Back',
          onClick: () => router.back(),
        },
        primaryButton: {
          label: 'Back to Home',
          onClick: () => router.push('/books'),
        },
      }}
    />
  )
}
