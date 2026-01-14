'use client'

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MDXViewer } from "@/components/ui/mdx-viewer"
import { Calendar, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils/format-date'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface BlogPostPreviewProps {
  title: string
  excerpt?: string
  content: string
  coverImage?: string
  categoryName?: string
  tags: string[]
  authorName: string
  authorImage?: string
  authorBio?: string
  publishedAt?: Date
  readTime?: number
  featured: boolean
}

export function BlogPostPreview({
  title,
  excerpt,
  content,
  coverImage,
  categoryName,
  tags,
  authorName,
  authorImage,
  authorBio,
  publishedAt,
  readTime,
  featured,
}: BlogPostPreviewProps) {
  // Calculate read time if not provided
  const calculatedReadTime = readTime || Math.max(1, Math.ceil(content.split(/\s+/).length / 200))

  return (
    <div className="h-full overflow-y-auto bg-background border rounded-lg p-4">
      <div className="mx-auto">
        {/* Header Label */}
        <div className="pb-4 border-b">
          <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
        </div>

        <article>
          {/* Category & Featured */}
          <div className="flex items-center gap-2 mb-4">
            {categoryName && (
              <Badge variant="secondary">{categoryName}</Badge>
            )}
            {featured && (
              <Badge variant="default" className="bg-yellow-500 text-yellow-950 hover:bg-yellow-600">
                Featured
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-lg font-bold mb-4">{title || 'Post Title'}</h1>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-lg text-muted-foreground mb-4">{excerpt}</p>
          )}

          {/* Cover Image */}
          {coverImage && (
            <div className="relative h-[300px] w-full rounded-lg overflow-hidden mb-8 bg-muted">
              <img
                src={coverImage}
                alt={title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
            <div className="flex items-center gap-4 text-sm">
              {publishedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(publishedAt)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{calculatedReadTime} min read</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}

          <Separator className="mb-8" />

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {content ? (
              <MDXViewer content={content} />
            ) : (
              <p className="text-muted-foreground italic">Your content will appear here...</p>
            )}
          </div>

          <Separator className="my-8" />

          {/* Author Bio */}
          <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
            <Avatar className="h-12 w-12">
              {authorImage ? (
                <AvatarImage src={getProxiedImageUrl(authorImage) || authorImage} alt={authorName} />
              ) : (
                <AvatarFallback>
                  {authorName
                    .split(' ')
                    .filter(n => n.length > 0)
                    .map(n => n[0].toUpperCase())
                    .slice(0, 2)
                    .join('') || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-semibold text-base mb-1">{authorName || 'Author Name'}</h3>
              <p className="text-muted-foreground text-sm">{authorBio || 'Author'}</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
