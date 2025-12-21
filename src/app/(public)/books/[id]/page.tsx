'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  Headphones,
  FileText,
  Users,
  Star,
  Clock,
  Calendar,
  Bookmark,
  Share2,
  Heart,
  Lock,
  Play,
  ArrowLeft,
  Download,
  Eye
} from 'lucide-react'
import { useBooks } from '@/hooks/use-books'
import { useReadingProgress } from '@/hooks/use-reading-progress'

export default function BookDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const bookId = params.id as string
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch book details
  const { data: booksData, isLoading, error } = useBooks({ limit: 1000 })
  const book = booksData?.data?.books.find(b => b.id === bookId)
  const { data: progress } = useReadingProgress(bookId)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading book details...</p>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <p className="text-muted-foreground mb-4">
            The book you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/books">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isEbook = book.type === 'EBOOK'
  const isAudio = book.type === 'AUDIO'
  const isHardCopy = book.type === 'HARD_COPY'

  const getTypeIcon = () => {
    switch (book.type) {
      case 'EBOOK': return <FileText className="h-5 w-5" />
      case 'AUDIO': return <Headphones className="h-5 w-5" />
      case 'HARD_COPY': return <BookOpen className="h-5 w-5" />
      default: return <BookOpen className="h-5 w-5" />
    }
  }

  const getTypeLabel = () => {
    switch (book.type) {
      case 'EBOOK': return 'Ebook'
      case 'AUDIO': return 'Audiobook'
      case 'HARD_COPY': return 'Hard Copy'
      default: return 'Book'
    }
  }

  const handleReadBook = () => {
    if (book.canAccess) {
      if (isEbook) {
        router.push(`/reader/${bookId}`)
      } else if (isAudio) {
        router.push(`/reader/${bookId}?type=audio`)
      } else {
        router.push(`/reader/${bookId}?type=hardcopy`)
      }
    } else {
      router.push('/premium')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.name,
          text: book.summary,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/books" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Link>
        </div>
      </div>

      {/* Book Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover and Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Book Cover */}
              <div className="relative mb-6">
                <div className="aspect-[3/4] overflow-hidden rounded-lg shadow-lg">
                  {book.image ? (
                    <Image
                      src={book.image}
                      alt={book.name}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      {getTypeIcon()}
                    </div>
                  )}
                </div>

                {/* Access Overlay */}
                {!book.canAccess && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-center text-white p-4">
                      <Lock className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-semibold">Premium Content</p>
                    </div>
                  </div>
                )}

                {/* Progress Badge */}
                {progress && (progress.currentPage || progress.currentEpocha) && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary/90 text-white">
                      {progress.isCompleted ? 'Completed' : `${Math.round(progress.progress)}%`}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Type and Premium Badges */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getTypeIcon()}
                  {getTypeLabel()}
                </Badge>
                {book.requiresPremium && (
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    Premium
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleReadBook}
                  className="w-full"
                  size="lg"
                  disabled={!book.canAccess}
                >
                  {book.canAccess ? (
                    <>
                      {isEbook && <Eye className="h-4 w-4 mr-2" />}
                      {isAudio && <Play className="h-4 w-4 mr-2" />}
                      {isHardCopy && <FileText className="h-4 w-4 mr-2" />}
                      {isEbook && 'Read Now'}
                      {isAudio && 'Listen Now'}
                      {isHardCopy && 'View Details'}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Upgrade to Read
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={isBookmarked ? 'text-primary' : ''}
                  >
                    <Bookmark className={cn("h-4 w-4 mr-2", isBookmarked && "fill-current")} />
                    {isBookmarked ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={isFavorite ? 'text-red-500' : ''}
                  >
                    <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-current")} />
                    {isFavorite ? 'Liked' : 'Like'}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 text-sm">
                {book.readersCount && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Readers</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {book.readersCount.toLocaleString()}
                    </span>
                  </div>
                )}
                {progress?.readingTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your reading time</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(progress.readingTime / 60)}h {progress.readingTime % 60}m
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{book.name}</h1>

              {/* Authors */}
              {book.authors.length > 0 && (
                <div className="mb-6">
                  <p className="text-lg text-muted-foreground">
                    by {book.authors.map(author => (
                  <Link key={author.id} href={`/authors/${author.id}`} className="hover:text-primary transition-colors">
                    {author.name}
                  </Link>
                )).join(', ')}
                  </p>
                </div>
              )}

              {/* Categories */}
              {book.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {book.categories.map((category) => (
                    <Link key={category.id} href={`/books?category=${category.name.toLowerCase()}`}>
                      <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                        {category.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Summary */}
              {book.summary && (
                <div className="prose max-w-none mb-8">
                  <p className="text-lg leading-relaxed">{book.summary}</p>
                </div>
              )}
            </div>

            {/* Detailed Information Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="progress">Your Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reading Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium flex items-center gap-1">
                          {getTypeIcon()}
                          {getTypeLabel()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Access</span>
                        <Badge variant={book.canAccess ? 'default' : 'secondary'}>
                          {book.canAccess ? 'Available' : 'Premium Only'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Readers</span>
                        <span className="font-medium">
                          {book.readersCount?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        onClick={handleReadBook}
                        className="w-full"
                        disabled={!book.canAccess}
                      >
                        {book.canAccess ? (
                          <>
                            {isEbook && <Eye className="h-4 w-4 mr-2" />}
                            {isAudio && <Play className="h-4 w-4 mr-2" />}
                            {isEbook && 'Start Reading'}
                            {isAudio && 'Start Listening'}
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Get Premium Access
                          </>
                        )}
                      </Button>

                      {book.fileUrl && book.canAccess && (
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Book Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">ISBN</p>
                          <p className="font-medium">N/A</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Publisher</p>
                          <p className="font-medium">N/A</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Language</p>
                          <p className="font-medium">English</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Pages</p>
                          <p className="font-medium">N/A</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Published Date</p>
                          <p className="font-medium">N/A</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">File Size</p>
                          <p className="font-medium">N/A</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="mt-6">
                {progress ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Reading Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{Math.round(progress.progress)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                        </div>

                        {progress.currentPage && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current Page</span>
                            <span className="font-medium">{progress.currentPage}</span>
                          </div>
                        )}

                        {progress.currentEpocha && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Position</span>
                            <span className="font-medium">
                              {Math.floor(progress.currentEpocha / 60)}m {Math.floor(progress.currentEpocha % 60)}s
                            </span>
                          </div>
                        )}

                        {progress.readingTime && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Reading Time</span>
                            <span className="font-medium">
                              {Math.floor(progress.readingTime / 60)}h {progress.readingTime % 60}m
                            </span>
                          </div>
                        )}

                        {progress.lastReadAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Read</span>
                            <span className="font-medium">
                              {new Date(progress.lastReadAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Button onClick={handleReadBook} className="w-full">
                      {progress.isCompleted ? (
                        <>Read Again</>
                      ) : (
                        <>
                          {isEbook && <Eye className="h-4 w-4 mr-2" />}
                          {isAudio && <Play className="h-4 w-4 mr-2" />}
                          Continue {isEbook ? 'Reading' : 'Listening'}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Reading Progress</h3>
                        <p className="text-muted-foreground mb-4">
                          Start reading this book to track your progress.
                        </p>
                        <Button onClick={handleReadBook}>
                          {isEbook ? 'Start Reading' : 'Start Listening'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}