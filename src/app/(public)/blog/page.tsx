'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, User, Eye, Star, FileText, PenSquare, Search, ArrowRight, TrendingUp, Tag, FolderTree } from 'lucide-react'
import { BlogPost, getBlogPosts, getBlogCategories, getBlogTags } from '@/app/dashboard/blog/actions'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { formatDate } from '@/lib/utils/format-date'
import { EmptyStateCard } from '@/components/ui/empty-state-card'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

export default function BlogPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(9)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')

  useEffect(() => {
    fetchPosts()
    fetchFeaturedPosts()
    fetchCategories()
    fetchTags()
  }, [page, selectedCategory, selectedTag])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const result = await getBlogPosts({
        page,
        limit,
        status: 'PUBLISHED',
        categoryId: selectedCategory || undefined,
        tagId: selectedTag || undefined,
        search: search || undefined,
      })
      setPosts(result.posts)
      setTotal(result.total)
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeaturedPosts = async () => {
    try {
      const result = await getBlogPosts({
        limit: 3,
        status: 'PUBLISHED',
        featured: true,
      })
      setFeaturedPosts(result.posts)
    } catch (error) {
      console.error('Error fetching featured posts:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await getBlogCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const data = await getBlogTags()
      setTags(data)
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchPosts()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-background">
      {/* Featured Posts Carousel - Infinite Scroll */}
      {featuredPosts.length > 0 && (
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center]" />
          <div className="relative container mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Star className="h-4 w-4 fill-current" />
                Featured Stories
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Explore Our <span className="text-primary">Blog</span>
              </h1>
            </div>

            {/* Infinite Scroll Carousel */}
            <div className="relative overflow-hidden">
              <div className="flex gap-6 animate-scroll-right-to-left hover:[animation-play-state:paused]">
                {[...featuredPosts, ...featuredPosts, ...featuredPosts].map((post, idx) => (
                  <Link key={`${post.id}-${idx}`} href={`/blog/${post.slug}`} className="flex-shrink-0 w-[320px] group">
                    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl h-full">
                      <div className="relative h-44 overflow-hidden">
                        {post.coverImage ? (
                          <Image
                            src={getProxiedImageUrl(post.coverImage) || post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <FileText className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-600">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {post.category && (
                            <Badge variant="secondary" className="text-xs">
                              {post.category.name}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{post.readTime} min</span>
                          </div>
                        </div>
                        <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {post.author.name || `${post.author.firstName} ${post.author.lastName || ''}`.trim()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            <span>{post.viewCount}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">

            {/* All Posts */}
            <div>
              {loading ? (
                <>
                  {/* Header Skeleton */}
                  <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-9 w-36" />
                  </div>
                  {/* Cards Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="overflow-hidden h-full">
                        <div className="relative h-48 overflow-hidden">
                          <Skeleton className="h-full w-full" />
                        </div>
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3 mb-4" />
                          <div className="flex gap-1 mb-4">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-14 rounded-full" />
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-7 w-7 rounded-full" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : posts.length === 0 ? (
                <EmptyStateCard
                  icon={FileText}
                  title="No articles found"
                  description="Try adjusting your filters or search terms"
                />
              ) : (
                <>
                  {/* Actual Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">
                      {selectedCategory || selectedTag ? 'Filtered Results' : 'Latest Articles'}
                    </h2>
                    <div className="flex items-center gap-2">
                      {user && !selectedCategory && !selectedTag && (
                        <Button
                          onClick={() => router.push('/dashboard/blog/new')}
                          size="sm"
                          className="group"
                        >
                          <PenSquare className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                          Write an Article
                        </Button>
                      )}
                      {(selectedCategory || selectedTag) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory('')
                            setSelectedTag('')
                            setPage(1)
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Actual Posts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {posts.map((post) => (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full border hover:border-primary/30">
                          <div className="relative h-48 overflow-hidden">
                            {post.coverImage ? (
                              <Image
                                src={getProxiedImageUrl(post.coverImage) || post.coverImage}
                                alt={post.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                <FileText className="h-12 w-12 text-muted-foreground/30" />
                              </div>
                            )}
                            {post.featured && (
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-600 text-xs">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Featured
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {post.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {post.category.name}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(post.publishedAt!)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{post.readTime} min</span>
                              </div>
                            </div>
                            <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {post.excerpt}
                            </p>
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {post.tags.slice(0, 3).map((tagItem) => (
                                  <Badge key={tagItem.tag.id} variant="outline" className="text-xs hover:bg-primary/10">
                                    <Tag className="h-2 w-2 mr-1" />
                                    {tagItem.tag.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-4 border-t text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-muted-foreground">
                                  {post.author.name || `${post.author.firstName} ${post.author.lastName || ''}`.trim()}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span className="text-xs">{post.viewCount}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {/* Modern Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ArrowRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                          .map((pageNum, idx, arr) => {
                            const prevPage = arr[idx - 1]
                            const showDots = prevPage && pageNum - prevPage > 1

                            return (
                              <div key={pageNum} className="flex items-center">
                                {showDots && <span className="px-2 text-muted-foreground">...</span>}
                                <Button
                                  variant={page === pageNum ? 'default' : 'outline'}
                                  size={page === pageNum ? 'default' : 'icon'}
                                  onClick={() => setPage(pageNum)}
                                  className={cn(
                                    page === pageNum && 'min-w-[40px]'
                                  )}
                                >
                                  {pageNum}
                                </Button>
                              </div>
                            )
                          })}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Modern Sidebar */}
          <div className="space-y-6">
            {/* Search Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Quick Search</h3>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Find articles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-10"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FolderTree className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Categories</h3>
                </div>
                <div className="space-y-1">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      !selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setSelectedCategory('')
                      setPage(1)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>All Posts</span>
                      <Badge variant={selectedCategory === '' ? 'secondary' : 'outline'} className="text-xs">
                        {total}
                      </Badge>
                    </div>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedCategory(category.id)
                        setPage(1)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <Badge variant={selectedCategory === category.id ? 'secondary' : 'outline'} className="text-xs">
                          {category._count?.posts || 0}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Popular Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.filter(t => t._count?.posts && t._count.posts > 0).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTag === tag.id ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        setSelectedTag(selectedTag === tag.id ? '' : tag.id)
                        setPage(1)
                      }}
                    >
                      {tag.name}
                      <span className="ml-1 text-xs opacity-70">({tag._count?.posts || 0})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Featured Post Sidebar */}
            {featuredPosts.length > 0 && (
              <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                    <h3 className="font-semibold">Editor's Pick</h3>
                  </div>
                  <Link href={`/blog/${featuredPosts[0].slug}`} className="group block">
                    {featuredPosts[0].coverImage && (
                      <div className="relative h-32 w-full rounded-lg overflow-hidden mb-3">
                        <Image
                          src={getProxiedImageUrl(featuredPosts[0].coverImage) || featuredPosts[0].coverImage}
                          alt={featuredPosts[0].title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </div>
                    )}
                    <h4 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {featuredPosts[0].title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {featuredPosts[0].excerpt}
                    </p>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

          {/* Newsletter Banner */}
          <div className="bg-muted/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                      <h3 className="font-semibold">Stay Updated</h3>
                      <p className="text-sm text-muted-foreground">Get the latest posts delivered to your inbox</p>
                  </div>
              </div>
              <Button variant="outline" className="shrink-0">
                  Subscribe to Newsletter
              </Button>
          </div>
      </div>
    </div>
  )
}
