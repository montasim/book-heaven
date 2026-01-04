'use client'

import {BookOpen} from "lucide-react";
import { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
  const [siteName, setSiteName] = useState('Book Heaven Admin')

  useEffect(() => {
    // Fetch site name from public API
    fetch('/api/public/site/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.siteName) {
          setSiteName(`${data.data.siteName} Admin`)
        }
      })
      .catch(console.error)
  }, [])

  return (
    <div className='container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8'>
        <div className='mb-4 flex items-center justify-center gap-2'>
          <BookOpen />
          <h1 className='text-xl font-medium'>{siteName}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
