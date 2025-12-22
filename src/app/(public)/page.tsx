'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Sparkles, ArrowRight, BookMarked, Headphones, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useBooks } from '@/hooks/use-books'
import { BookCard } from '@/components/books/book-card'
import { PublicHeader } from '@/components/layout/public-header'

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Discovery Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <PublicHeader />

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Discover Your Next Great Read
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Browse thousands of books, track your reading progress, and connect with fellow book lovers.
              Start your reading journey today!
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link href="/books">
                <Button size="lg" className="text-lg px-8">
                  Browse Books
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>Ebooks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Headphones className="h-4 w-4" />
                  <span>Audiobooks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Community</span>
                </div>
              </div>
            </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-2" />
              </CardHeader>
              <CardContent>
                <CardTitle>Extensive Library</CardTitle>
                <CardDescription>
                  Access thousands of books across all genres, from timeless classics to modern bestsellers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BookMarked className="h-12 w-12 text-primary mx-auto mb-2" />
              </CardHeader>
              <CardContent>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Monitor your reading journey with detailed progress tracking and personalized recommendations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-2" />
              </CardHeader>
              <CardContent>
                <CardTitle>Premium Features</CardTitle>
                <CardDescription>
                  Unlock exclusive content, advanced reading tools, and ad-free experience with premium.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Featured Books */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Featured Books</h3>
              <Link href="/books">
                <Button variant="outline">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-64 bg-muted rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Unable to load featured books</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredBooks?.data?.books?.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Right Side - Auth CTA */}
      <div className="w-full lg:w-96 border-l bg-muted/10">
        <div className="h-full flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">
                Sign in to access your personal library and continue your reading journey.
              </p>
            </div>

            {/* Sign In CTA */}
            <Link href="/auth/sign-in">
              <Button className="w-full">
                Sign In
              </Button>
            </Link>

            {/* Sign Up CTA */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Don't have an account yet?
              </p>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Features Preview */}
            <div className="space-y-4">
              <h3 className="font-semibold">What you'll get:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Personal reading recommendations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Progress tracking across devices</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Create custom bookshelves</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Share with friends</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

