'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LibraryBig, ArrowLeft, Lock, Eye, Home, List } from 'lucide-react'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { useAuth } from '@/context/auth-context'
import { BookTypeBadge } from '@/components/books/book-type-badge'
import type { Book } from '@/hooks/use-book'

// Extended type for books in series context
interface BookWithSeriesOrder extends Book {
  seriesOrder?: number
  readersCount?: number
}

export default function SeriesDetailPage() {
  const params = useParams()
  const router = useRouter()
  const seriesId = params.id as string
  const { user } = useAuth()

  const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch series')
    return res.json()
  }

  const { data, isLoading, error } = useSWR(`/api/public/series/${seriesId}`, fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto border-2">
            <CardContent className="p-12 text-center space-y-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
                <List className="h-10 w-10 text-muted-foreground" />
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Series Not Found</h1>
                <p className="text-muted-foreground text-lg">
                  We couldn&apos;t find the series you&apos;re looking for
                </p>
              </div>

              {/* Helpful suggestions */}
              <div className="text-left space-y-3 max-w-md mx-auto">
                <p className="text-sm font-medium">This might have happened because:</p>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>The series ID might be incorrect or mistyped</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>The series has been removed from our library</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>The series might be temporarily unavailable</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/series">
                    <LibraryBig className="h-4 w-4 mr-2" />
                    Browse All Series
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Homepage
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const series = data.data
  const hasPremium = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <NavigationBreadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Series', href: '/series' },
              { label: series.name }
            ]}
          />
          <div className="mt-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/series')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Series
            </Button>
            <div className="flex items-start gap-4">
              {series.image && (
                <div className="relative w-24 h-36 rounded-lg overflow-hidden border flex-shrink-0">
                  <Image
                    src={getProxiedImageUrl(series.image) || series.image}
                    alt={series.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{series.name}</h1>
                <p className="text-muted-foreground mt-2">
                  {series.bookCount} book{series.bookCount !== 1 ? 's' : ''} in this series
                </p>
                {series.description && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                    {series.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="container mx-auto px-4 py-8">
        {series.books.length === 0 ? (
          <div className="text-center py-12">
            <LibraryBig className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No books yet</h3>
            <p className="text-muted-foreground">Books will appear here once they are added to this series.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {series.books.map((book: BookWithSeriesOrder, index: number) => {
              const canAccess = !book.requiresPremium || hasPremium

              return (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50">
                    <CardHeader className="p-3">
                      <div className="relative aspect-[2/3] w-full mb-3 rounded-md overflow-hidden bg-muted">
                        {book.image ? (
                          <Image
                            src={getProxiedImageUrl(book.image) || book.image}
                            alt={book.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No cover</span>
                          </div>
                        )}
                        {!canAccess && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                        {book.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {book.seriesOrder !== undefined && book.seriesOrder !== null && (
                          <Badge variant="secondary" className="text-xs">
                            #{book.seriesOrder}
                          </Badge>
                        )}
                        <BookTypeBadge type={book.type} />
                        {book.requiresPremium && (
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{book.readersCount ?? 0} reader{(book.readersCount ?? 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
