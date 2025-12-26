'use client'

import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

interface Notice {
  id: string
  title: string
  content: string
  order: number
}

interface NoticesResponse {
  success: boolean
  data: {
    notices: Notice[]
    total: number
  }
}

export function NoticeTicker() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNotices() {
      try {
        const res = await fetch('/api/public/notices', {
          cache: 'no-store',
        })
        if (res.ok) {
          const data: NoticesResponse = await res.json()
          setNotices(data.data.notices)
        }
      } catch (error) {
        console.error('Failed to fetch notices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotices()
  }, [])

  // Don't render anything while loading or if no notices
  if (isLoading || notices.length === 0) {
    return null
  }

  // Duplicate notices to create seamless loop
  const duplicatedNotices = [...notices, ...notices]

  return (
    <div className="w-full border-b bg-primary/5 dark:bg-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 overflow-hidden py-2">
          {/* Icon Section - Clickable to view all notices */}
          <Link href="/notices" className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 shrink-0 rounded hover:bg-primary/20 transition-colors">
            <Megaphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Notices</span>
          </Link>

          {/* Scrolling Notices */}
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div
              className="inline-flex items-center"
              style={{
                animation: 'scroll 30s linear infinite',
              }}
            >
              {duplicatedNotices.map((notice, index) => {
                const originalIndex = index % notices.length
                const isLastNotice = originalIndex === notices.length - 1 && index >= notices.length
                return (
                  <React.Fragment key={`${notice.id}-${index}`}>
                    <Link
                      href={`/notices?notice=${notice.id}`}
                      className="inline-flex items-center gap-2 hover:underline"
                      style={{ padding: '0 0.5rem', fontSize: '0.875rem' }}
                    >
                      <span className="font-semibold text-primary whitespace-nowrap">{notice.title}</span>
                      <span className="text-muted-foreground shrink-0">:</span>
                      <span className="truncate">
                        {notice.content?.trim() || notice.title}
                      </span>
                    </Link>
                    {!isLastNotice && (
                      <span className="text-primary font-bold" style={{ padding: '0 0.5rem' }}>|</span>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}
