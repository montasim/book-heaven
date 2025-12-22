'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BookshelvesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/library?tab=bookshelves')
  }, [router])

  return null
}
