'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BookGrid } from '@/components/books/book-grid'
import { NavigationBreadcrumb } from '@/components/ui/breadcrumb'
import { MDXViewer } from '@/components/ui/mdx-viewer'
import { EntityDetailsSkeleton } from '@/components/entities/entity-details-skeleton'
import { useTranslator } from '@/hooks/use-translator'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { getUserDisplayName } from '@/lib/utils/user'
import {
  BookOpen,
  Users,
  Calendar,
  Home,
  User as UserIcon,
  Languages,
  Eye,
} from 'lucide-react'
import { ROUTES } from '@/lib/routes/client-routes'

export default function TranslatorDetailsPage() {
  const params = useParams()
  const translatorId = params.id as string

  const { data: responseData, isLoading, error } = useTranslator({ id: translatorId })
  const translator = responseData?.data?.translator

  // Track page view when translator is loaded
  useEffect(() => {
    if (translatorId && translator) {
      // Track view asynchronously in the background
      fetch(`/api/translators/${translatorId}/view`, { method: 'POST' }).catch((err) => {
        console.error('Failed to track view:', err)
      })
    }
  }, [translatorId, translator])

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  if (isLoading) {
    return <EntityDetailsSkeleton entityType="translator" />
  }

  if (error || !translator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto border-2">
            <CardContent className="p-12 text-center space-y-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted">
                <Languages className="h-10 w-10 text-muted-foreground" />
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <h1 className="text-xl font-bold">Translator Not Found</h1>
                <p className="text-muted-foreground text-lg">
                  We couldn&apos;t find the translator you&apos;re looking for
                </p>
              </div>

              {/* Helpful suggestions */}
              <div className="text-left space-y-3 max-w-md mx-auto">
                <p className="text-sm font-medium">This might have happened because:</p>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>The translator ID might be incorrect or mistyped</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>The translator has been removed from our library</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>The translator profile might be temporarily unavailable</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/translators">
                    <Languages className="h-4 w-4 mr-2" />
                    Browse All Translators
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href={ROUTES.home.href}>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <NavigationBreadcrumb
          className="mb-6"
          items={[
            { label: 'Home', href: ROUTES.home.href, icon: <Home className="h-4 w-4" /> },
            { label: 'Translators', href: '/translators', icon: <Languages className="h-4 w-4" /> },
            { label: translator.name },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6">
          {/* Translator Image and Stats - Left Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Translator Image */}
              <div className="relative mb-6 max-w-xs mx-auto lg:mx-0">
                <div className="aspect-square rounded-lg overflow-hidden shadow-lg bg-muted">
                  {translator.image ? (
                    <Image
                      src={getProxiedImageUrl(translator.image) || translator.image}
                      alt={translator.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Languages className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Books
                      </span>
                      <span className="font-medium">{translator.statistics.totalBooks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Readers
                      </span>
                      <span className="font-medium">{translator.statistics.totalReaders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Entry Date
                      </span>
                      <span className="font-medium">{formatDate(translator.entryDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Translator Information and Books - Right Column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              {/* Name and Visitor Count Row */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">{translator.name}</h1>

                {/* Visitor Count */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{translator.analytics?.totalViews?.toLocaleString() || '0'} views</span>
                </div>
              </div>

              {/* Added by user */}
              {translator.entryBy && (
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/users/${translator.entryBy.id}`} className="flex items-center gap-3 group">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={translator.entryBy.avatar ? getProxiedImageUrl(translator.entryBy.avatar) || translator.entryBy.avatar : undefined}
                        alt={getUserDisplayName({
                          firstName: translator.entryBy.firstName,
                          lastName: translator.entryBy.lastName,
                          username: translator.entryBy.username,
                          name: translator.entryBy.name,
                          email: '',
                        })}
                      />
                      <AvatarFallback className="text-sm bg-primary/10">
                        {translator.entryBy.username
                          ? translator.entryBy.username[0].toUpperCase()
                          : translator.entryBy.firstName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Added by</span>
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                        {getUserDisplayName({
                          firstName: translator.entryBy.firstName,
                          lastName: translator.entryBy.lastName,
                          username: translator.entryBy.username,
                          name: translator.entryBy.name,
                          email: '',
                        })}
                      </span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Description */}
              {translator.description && (
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <MDXViewer content={translator.description} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Books by Translator */}
            {translator.books && translator.books.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-6">Books Translated by {translator.name}</h2>
                <BookGrid
                  books={translator.books}
                  viewMode="grid"
                  viewMoreHref={(book) => `/books/${book.id}`}
                  showTypeBadge={true}
                  showPremiumBadge={true}
                  showCategories={true}
                  showReaderCount={true}
                  showAddToBookshelf={true}
                  showLockOverlay={true}
                  coverHeight="tall"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
