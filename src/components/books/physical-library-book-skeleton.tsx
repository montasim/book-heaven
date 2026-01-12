'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Users, Share2, QrCode } from 'lucide-react'

export function PhysicalLibraryBookSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Book Details */}
      <div className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6">
          {/* Book Cover and Actions - Left Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Book Cover Skeleton */}
              <div className="relative mb-4 sm:mb-6 max-w-auto mx-auto lg:mx-0">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />

                {/* Type Badge Skeleton - Top Left */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>

                {/* Share Button Skeleton - Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded" />
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="space-y-3 mb-6">
                <Skeleton className="h-12 w-full rounded" />
              </div>

              {/* QR Code Skeleton */}
              <div className="border rounded-lg p-4 bg-card">
                <Skeleton className="h-32 w-32 mx-auto rounded" />
              </div>
            </div>
          </div>

          {/* Book Information - Right Column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              {/* Title Skeleton */}
              <Skeleton className="h-8 w-3/4 mb-4" />

              {/* Authors Skeleton */}
              <Skeleton className="h-6 w-1/2 mb-4" />

              {/* Categories Skeleton */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              {/* Publication Skeleton */}
              <Skeleton className="h-5 w-48 mb-4" />

              {/* Quick Stats Skeleton */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Tabs Content Skeleton */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                <TabsTrigger value="details" disabled>
                  <Skeleton className="h-5 w-16" />
                </TabsTrigger>
                <TabsTrigger value="history" disabled>
                  <Skeleton className="h-5 w-20" />
                </TabsTrigger>
              </TabsList>

              {/* Details Tab Content */}
              <TabsContent value="details" className="mt-4 space-y-4">
                {/* Description Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>

                {/* Authors Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Translators Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-44" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Publisher Card Skeleton */}
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab Content */}
              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <Skeleton className="h-4 w-48 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
