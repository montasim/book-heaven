'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MDXViewer } from "@/components/ui/mdx-viewer"
import { BlogCommentsSection } from "@/components/blog/blog-comments-section"
import { BreadcrumbList } from "@/components/breadcrumb/breadcrumb"
import { BlogPost, getBlogPostBySlug, incrementBlogPostView, getBlogPosts } from '@/app/dashboard/blog/actions'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { formatDate } from '@/lib/utils/format-date'
import { Calendar, Clock, User, Eye, ArrowLeft, Share2, Home } from 'lucide-react'

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const postData = await getBlogPostBySlug(slug)
      setPost(postData)

      // Increment view count (non-blocking)
      incrementBlogPostView(slug).catch(console.error)

      // Fetch related posts (same category)
      if (postData.categoryId) {
        const related = await getBlogPosts({
          limit: 3,
          status: 'PUBLISHED',
          categoryId: postData.categoryId,
        })
        setRelatedPosts(related.posts.filter(p => p.id !== postData.id))
      }
    } catch (error) {
      console.error('Error fetching blog post:', error)
      // Redirect to 404
      router.push('/404')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || post?.title,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-3">
          <Skeleton className="h-5 w-48" />
        </div>

        <main className="container mx-auto p-4 pb-6">
          {/* Post Header */}
          <div className="mb-4">
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-5 w-full mb-6" />
          </div>

          {/* Cover Image */}
          <Skeleton className="h-[400px] w-full rounded-lg mb-6" />

          {/* Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          <Separator className="mb-8" />

          {/* Content */}
          <div className="space-y-3 mb-12">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <Separator className="mb-8" />

          {/* Author Bio */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </main>
      </div>
    )
  }

  if (!post) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-3">
            <BreadcrumbList
                items={[
                    { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
                    { label: 'Blog', href: '/blog' },
                    { label: post.title }
                ]}
            />
        </div>

      <main className="container mx-auto p-4 pb-6 text-xl">
        {/* Post Header */}
        <article>
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {post.category && (
                <Link href={`/blog?category=${post.category.id}`}>
                  <Badge variant="secondary">{post.category.name}</Badge>
                </Link>
              )}
              {post.featured && (
                <Badge variant="default" className="bg-yellow-500 text-yellow-950 hover:bg-yellow-600">
                  Featured
                </Badge>
              )}
            </div>

            <h1 className="text-xl font-bold mb-4">{post.title}</h1>

            {post.excerpt && (
              <p className="text-muted-foreground mb-6">{post.excerpt}</p>
            )}

            {/* Cover Image */}
            {post.coverImage && (
              <div className="relative h-[400px] w-full rounded-lg overflow-hidden mb-8">
                <Image
                  src={getProxiedImageUrl(post.coverImage) || post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            )}

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.publishedAt!)}</span>
                </div>
                {post.readTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime} min read</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount} views</span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tagItem) => (
                  <Link key={tagItem.tag.id} href={`/blog?tag=${tagItem.tag.id}`}>
                    <Badge variant="outline">{tagItem.tag.name}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </header>

          <Separator className="mb-8" />

          {/* Post Content */}
          <div className="prose max-w-none mb-12">
            <MDXViewer content={post.content} />
          </div>

          <Separator className="mb-8" />

          {/* Author Bio */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  {post.author.avatar ? (
                    <AvatarImage src={getProxiedImageUrl(post.author.avatar) || post.author.avatar} />
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {post.author.name || `${post.author.firstName} ${post.author.lastName || ''}`.trim()}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">Author</p>
                  {post.author.bio ? (
                    <p className="text-sm whitespace-pre-wrap">{post.author.bio}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No bio available for this author.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          {post.allowComments && (
            <BlogCommentsSection postId={post.id} postSlug={post.slug} />
          )}
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    {relatedPost.coverImage && (
                      <div className="relative h-40 w-full">
                        <Image
                          src={getProxiedImageUrl(relatedPost.coverImage) || relatedPost.coverImage}
                          alt={relatedPost.title}
                          fill
                          className="object-cover rounded-t-lg"
                          unoptimized
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-base">{relatedPost.title}</CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
