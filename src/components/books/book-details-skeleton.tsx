'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Users, Calendar, Eye } from 'lucide-react'

export function BookDetailsSkeleton() {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Book Cover and Actions - Left Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Book Cover Skeleton */}
              <div className="relative mb-4 sm:mb-6 max-w-auto mx-auto lg:mx-0">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />

                {/* Type Badge Skeleton - Top Left */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded" />
                </div>

                {/* Premium Badge Skeleton - Bottom Left */}
                <div className="absolute bottom-3 left-3">
                  <Skeleton className="h-5 w-16 rounded" />
                </div>

                {/* Share Button Skeleton - Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded" />
                  <Skeleton className="h-9 w-9 rounded" />
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="space-y-3 mb-6">
                <Skeleton className="h-12 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>

              {/* Quick Stats Skeleton */}
              <div className="space-y-3 text-sm pt-2 p-4 rounded-xl border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>

          {/* Book Information - Right Column */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              {/* Title and Chat Button Row Skeleton */}
              <div className='flex items-center justify-between mb-3'>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-10 w-32 rounded hidden sm:block" />
              </div>

              {/* Authors and Visitor Count Row - Desktop Skeleton */}
              <div className='flex items-center justify-between mb-4 hidden sm:flex'>
                <Skeleton className="h-6 w-1/2" />
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Mobile: Chat Button Skeleton */}
              <Skeleton className="h-10 w-full rounded mb-3 sm:hidden" />

              {/* Mobile: Authors and Visitor Count Skeleton */}
              <div className='flex items-center justify-between gap-2 mb-4 sm:hidden'>
                <Skeleton className="h-5 w-1/2" />
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>

            {/* Tabs Content Skeleton */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                <TabsTrigger value="description" disabled>
                  <Skeleton className="h-5 w-24" />
                </TabsTrigger>
                <TabsTrigger value="about" disabled>
                  <Skeleton className="h-5 w-16" />
                </TabsTrigger>
                <TabsTrigger value="reviews" disabled>
                  <Skeleton className="h-5 w-20" />
                </TabsTrigger>
                <TabsTrigger value="ai-summary" disabled>
                  <Skeleton className="h-5 w-20" />
                </TabsTrigger>
              </TabsList>

              {/* Description Tab Content */}
              <TabsContent value="description" className="mt-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Additional Sections Skeleton */}
            <div className="space-y-6 mt-6">
              {/* Categories Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
