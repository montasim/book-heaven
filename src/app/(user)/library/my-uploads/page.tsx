'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MyUploadsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/library?tab=my-uploads')
  }, [router])

  return null
}
