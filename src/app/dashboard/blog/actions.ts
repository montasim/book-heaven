'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth/session'
import { z } from 'zod'

// ============================================================================
// Types & Schemas
// ============================================================================

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  authorId: string
  author: {
    id: string
    name: string
    firstName: string
    lastName: string | null
    email: string
    avatar: string | null
    bio: string | null
  }
  categoryId: string | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  tags: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
  status: PostStatus
  publishedAt: Date | null
  scheduledFor: Date | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string[]
  featured: boolean
  allowComments: boolean
  viewCount: number
  readTime: number | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    comments: number
  }
}

export interface BlogComment {
  id: string
  content: string
  authorId: string
  author: {
    id: string
    name: string
    firstName: string
    lastName: string | null
    email: string
    avatar: string | null
    bio: string | null
  }
  postId: string
  parentId: string | null
  status: CommentStatus
  createdAt: Date
  updatedAt: Date
  post?: {
    id: string
    title: string
    slug: string
  }
  replies?: BlogComment[]
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  order: number
  _count?: {
    posts: number
  }
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  _count?: {
    posts: number
  }
}

// Zod Schemas
const BlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).default('DRAFT'),
  scheduledFor: z.date().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
})

const BlogCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  order: z.number().default(0),
})

const BlogTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
})

// ============================================================================
// Blog Post Actions
// ============================================================================

export interface GetBlogPostsParams {
  page?: number
  limit?: number
  search?: string
  status?: PostStatus
  categoryId?: string
  tagId?: string
  authorId?: string
  featured?: boolean
  orderBy?: 'createdAt' | 'publishedAt' | 'title' | 'viewCount'
  orderDirection?: 'asc' | 'desc'
}

export async function getBlogPosts(params: GetBlogPostsParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    categoryId,
    tagId,
    authorId,
    featured,
    orderBy = 'createdAt',
    orderDirection = 'desc',
  } = params

  const session = await getSession()
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'
  const currentUserId = session?.userId

  const where: any = {}

  // Non-admins can only see published posts (unless they're the author)
  if (!isAdmin) {
    where.OR = [
      { status: 'PUBLISHED' },
      currentUserId ? { authorId: currentUserId } : {},
    ].filter((condition) => Object.keys(condition).length > 0)
  }

  if (search) {
    where.OR = [
      ...(where.OR || []),
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (tagId) {
    where.tags = {
      some: { tagId }
    }
  }

  if (authorId) {
    where.authorId = authorId
  }

  if (featured !== undefined) {
    where.featured = featured
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [orderBy]: orderDirection },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    }),
    prisma.blogPost.count({ where })
  ])

  return {
    posts: posts as BlogPost[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function getBlogPostById(id: string) {
  const session = await getSession()
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'
  const currentUserId = session?.userId

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          bio: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      },
      _count: {
        select: { comments: true }
      }
    }
  })

  if (!post) {
    throw new Error('Blog post not found')
  }

  // Check access permissions
  if (!isAdmin && post.status !== 'PUBLISHED' && post.authorId !== currentUserId) {
    throw new Error('Access denied')
  }

  return post as BlogPost
}

export async function getBlogPostBySlug(slug: string) {
  const session = await getSession()
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'
  const currentUserId = session?.userId

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          bio: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      },
      _count: {
        select: { comments: true }
      }
    }
  })

  if (!post) {
    throw new Error('Blog post not found')
  }

  // Check access permissions
  if (!isAdmin && post.status !== 'PUBLISHED' && post.authorId !== currentUserId) {
    throw new Error('Access denied')
  }

  return post as BlogPost
}

export async function createBlogPost(data: z.infer<typeof BlogPostSchema>) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const validated = BlogPostSchema.parse(data)

  // Check if slug is unique
  const existing = await prisma.blogPost.findUnique({
    where: { slug: validated.slug }
  })

  if (existing) {
    throw new Error('A post with this slug already exists')
  }

  // Validate category exists if provided
  if (validated.categoryId) {
    const category = await prisma.blogCategory.findUnique({
      where: { id: validated.categoryId }
    })
    if (!category) {
      throw new Error('Selected category not found')
    }
  }

  // Validate all tags exist
  if (validated.tagIds.length > 0) {
    const tags = await prisma.blogTag.findMany({
      where: { id: { in: validated.tagIds } }
    })
    if (tags.length !== validated.tagIds.length) {
      throw new Error('One or more selected tags not found')
    }
  }

  // Calculate read time (rough estimate: 200 words per minute)
  const wordCount = validated.content.split(/\s+/).length
  const readTime = Math.ceil(wordCount / 200)

  const post = await prisma.blogPost.create({
    data: {
      title: validated.title,
      slug: validated.slug,
      excerpt: validated.excerpt,
      content: validated.content,
      coverImage: validated.coverImage,
      authorId: session.userId,
      categoryId: validated.categoryId || null,
      status: validated.status,
      scheduledFor: validated.scheduledFor,
      seoTitle: validated.seoTitle,
      seoDescription: validated.seoDescription,
      seoKeywords: validated.seoKeywords,
      featured: validated.featured,
      allowComments: validated.allowComments,
      readTime,
      publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
      tags: {
        create: validated.tagIds.map((tagId) => ({ tagId }))
      }
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          bio: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      },
      _count: {
        select: { comments: true }
      }
    }
  })

  // Revalidate paths
  revalidatePath('/dashboard/blog')
  revalidatePath('/blog')

  // Log activity
  logActivity('CREATE', 'BLOG_POST', post.id, `Created blog post: ${post.title}`)

  return post as BlogPost
}

export async function updateBlogPost(id: string, data: z.infer<typeof BlogPostSchema>) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const validated = BlogPostSchema.parse(data)

  // Check if user can edit this post
  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { authorId: true, publishedAt: true }
  })

  if (!existing) {
    throw new Error('Blog post not found')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (existing.authorId !== session.userId && !isAdmin) {
    throw new Error('Access denied')
  }

  // Check if new slug is unique (if changed)
  if (validated.slug) {
    const slugExists = await prisma.blogPost.findFirst({
      where: {
        slug: validated.slug,
        NOT: { id }
      }
    })

    if (slugExists) {
      throw new Error('A post with this slug already exists')
    }
  }

  // Calculate read time
  const wordCount = validated.content.split(/\s+/).length
  const readTime = Math.ceil(wordCount / 200)

  // Validate category exists if provided
  if (validated.categoryId) {
    const category = await prisma.blogCategory.findUnique({
      where: { id: validated.categoryId }
    })
    if (!category) {
      throw new Error('Selected category not found')
    }
  }

  // Validate all tags exist
  if (validated.tagIds.length > 0) {
    const tags = await prisma.blogTag.findMany({
      where: { id: { in: validated.tagIds } }
    })
    if (tags.length !== validated.tagIds.length) {
      throw new Error('One or more selected tags not found')
    }
  }

  // Remove old tags and add new ones
  await prisma.blogPostTag.deleteMany({
    where: { postId: id }
  })

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: validated.title,
      slug: validated.slug,
      excerpt: validated.excerpt,
      content: validated.content,
      coverImage: validated.coverImage,
      categoryId: validated.categoryId || null,
      status: validated.status,
      scheduledFor: validated.scheduledFor,
      seoTitle: validated.seoTitle,
      seoDescription: validated.seoDescription,
      seoKeywords: validated.seoKeywords,
      featured: validated.featured,
      allowComments: validated.allowComments,
      readTime,
      publishedAt: validated.status === 'PUBLISHED' && !existing.publishedAt
        ? new Date()
        : undefined,
      tags: {
        create: validated.tagIds.map((tagId) => ({ tagId }))
      }
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          bio: true,
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        }
      },
      _count: {
        select: { comments: true }
      }
    }
  })

  // Revalidate paths
  revalidatePath('/dashboard/blog')
  revalidatePath('/blog')
  revalidatePath(`/blog/${post.slug}`)

  // Log activity
  logActivity('UPDATE', 'BLOG_POST', id, `Updated blog post: ${post.title}`)

  return post as BlogPost
}

export async function deleteBlogPost(id: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { authorId: true, title: true }
  })

  if (!post) {
    throw new Error('Blog post not found')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (post.authorId !== session.userId && !isAdmin) {
    throw new Error('Access denied')
  }

  await prisma.blogPost.delete({
    where: { id }
  })

  // Revalidate paths
  revalidatePath('/dashboard/blog')
  revalidatePath('/blog')

  // Log activity
  logActivity('DELETE', 'BLOG_POST', id, `Deleted blog post: ${post.title}`)

  return { success: true }
}

export async function publishBlogPost(id: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { authorId: true, title: true }
  })

  if (!post) {
    throw new Error('Blog post not found')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (post.authorId !== session.userId && !isAdmin) {
    throw new Error('Access denied')
  }

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date()
    }
  })

  revalidatePath('/dashboard/blog')
  revalidatePath('/blog')

  logActivity('UPDATE', 'BLOG_POST', id, `Published blog post: ${post.title}`)

  return updated
}

export async function toggleFeaturedPost(id: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (!isAdmin) {
    throw new Error('Access denied')
  }

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { featured: true }
  })

  if (!post) {
    throw new Error('Blog post not found')
  }

  const updated = await prisma.blogPost.update({
    where: { id },
    data: { featured: !post.featured }
  })

  revalidatePath('/dashboard/blog')
  revalidatePath('/blog')

  logActivity('UPDATE', 'BLOG_POST', id, `${updated.featured ? 'Featured' : 'Unfeatured'} blog post`)

  return updated
}

// ============================================================================
// Category Actions
// ============================================================================

export async function getBlogCategories() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  })

  return categories as BlogCategory[]
}

export async function getBlogCategoryById(id: string) {
  const category = await prisma.blogCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  })

  if (!category) {
    throw new Error('Category not found')
  }

  return category as BlogCategory
}

export async function createBlogCategory(data: z.infer<typeof BlogCategorySchema>) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (!isAdmin) {
    throw new Error('Access denied')
  }

  const validated = BlogCategorySchema.parse(data)

  const category = await prisma.blogCategory.create({
    data: validated
  })

  revalidatePath('/dashboard/blog/categories')

  logActivity('CREATE', 'BLOG_CATEGORY', category.id, `Created blog category: ${category.name}`)

  return category
}

export async function updateBlogCategory(id: string, data: z.infer<typeof BlogCategorySchema>) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (!isAdmin) {
    throw new Error('Access denied')
  }

  const validated = BlogCategorySchema.parse(data)

  const category = await prisma.blogCategory.update({
    where: { id },
    data: validated
  })

  revalidatePath('/dashboard/blog/categories')

  logActivity('UPDATE', 'BLOG_CATEGORY', id, `Updated blog category: ${category.name}`)

  return category
}

export async function deleteBlogCategory(id: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (!isAdmin) {
    throw new Error('Access denied')
  }

  await prisma.blogCategory.delete({
    where: { id }
  })

  revalidatePath('/dashboard/blog/categories')

  logActivity('DELETE', 'BLOG_CATEGORY', id, 'Deleted blog category')

  return { success: true }
}

// ============================================================================
// Tag Actions
// ============================================================================

export async function getBlogTags() {
  const tags = await prisma.blogTag.findMany({
    include: {
      _count: {
        select: { posts: true }
      }
    }
  })

  return tags as BlogTag[]
}

export async function getBlogTagById(id: string) {
  const tag = await prisma.blogTag.findUnique({
    where: { id },
    include: {
      _count: {
        select: { posts: true }
      }
    }
  })

  if (!tag) {
    throw new Error('Tag not found')
  }

  return tag as BlogTag
}

export async function createBlogTag(data: z.infer<typeof BlogTagSchema>) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (!isAdmin) {
    throw new Error('Access denied')
  }

  const validated = BlogTagSchema.parse(data)

  const tag = await prisma.blogTag.create({
    data: validated
  })

  revalidatePath('/dashboard/blog/tags')

  logActivity('CREATE', 'BLOG_TAG', tag.id, `Created blog tag: ${tag.name}`)

  return tag
}

export async function updateBlogTag(id: string, data: z.infer<typeof BlogTagSchema>) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (!isAdmin) {
    throw new Error('Access denied')
  }

  const validated = BlogTagSchema.parse(data)

  const tag = await prisma.blogTag.update({
    where: { id },
    data: validated
  })

  revalidatePath('/dashboard/blog/tags')

  logActivity('UPDATE', 'BLOG_TAG', id, `Updated blog tag: ${tag.name}`)

  return tag
}

export async function deleteBlogTag(id: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (!isAdmin) {
    throw new Error('Access denied')
  }

  await prisma.blogTag.delete({
    where: { id }
  })

  revalidatePath('/dashboard/blog/tags')

  logActivity('DELETE', 'BLOG_TAG', id, 'Deleted blog tag')

  return { success: true }
}

// ============================================================================
// Comment Actions
// ============================================================================

export interface GetBlogCommentsParams {
  page?: number
  limit?: number
  postId?: string
  status?: CommentStatus
}

export async function getBlogComments(params: GetBlogCommentsParams = {}) {
  const { page = 1, limit = 10, postId, status } = params

  const session = await getSession()
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'

  const where: any = {}

  // Non-admins can see approved comments AND their own pending comments
  if (!isAdmin) {
    const conditions: any[] = [{ status: 'APPROVED' }]
    if (session) {
      conditions.push({ status: 'PENDING', authorId: session.userId })
    }
    where.OR = conditions
  }

  if (postId) {
    where.postId = postId
  }

  if (status && isAdmin) {
    where.status = status
  }

  const [comments, total] = await Promise.all([
    prisma.blogComment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            bio: true,
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        },
        replies: {
          where: !isAdmin ? {
            OR: (() => {
              const conditions: any[] = [{ status: 'APPROVED' }]
              if (session) {
                conditions.push({ status: 'PENDING', authorId: session.userId })
              }
              return conditions
            })()
          } : undefined,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                bio: true,
              }
            }
          }
        }
      }
    }),
    prisma.blogComment.count({ where })
  ])

  return {
    comments: comments as BlogComment[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function createBlogComment(postId: string, content: string, parentId?: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { allowComments: true }
  })

  if (!post) {
    throw new Error('Blog post not found')
  }

  if (!post.allowComments) {
    throw new Error('Comments are not allowed on this post')
  }

  const comment = await prisma.blogComment.create({
    data: {
      content,
      authorId: session.userId,
      postId,
      parentId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          bio: true,
        }
      },
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
        }
      }
    }
  })

  revalidatePath('/blog/[slug]')

  return comment as BlogComment
}

export async function updateBlogCommentStatus(id: string, status: CommentStatus) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  if (!isAdmin) {
    throw new Error('Access denied')
  }

  const comment = await prisma.blogComment.update({
    where: { id },
    data: { status }
  })

  revalidatePath('/blog/[slug]')

  logActivity('UPDATE', 'BLOG_COMMENT', id, `Updated comment status to ${status}`)

  return comment
}

export async function deleteBlogComment(id: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
  const isAuthor = await prisma.blogComment.findUnique({
    where: { id },
    select: { authorId: true }
  })

  if (!isAuthor) {
    throw new Error('Comment not found')
  }

  if (isAuthor.authorId !== session.userId && !isAdmin) {
    throw new Error('Access denied')
  }

  await prisma.blogComment.delete({
    where: { id }
  })

  revalidatePath('/blog/[slug]')

  logActivity('DELETE', 'BLOG_COMMENT', id, 'Deleted blog comment')

  return { success: true }
}

// ============================================================================
// Blog Statistics
// ============================================================================

export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  archivedPosts: number
  featuredPosts: number
  totalViews: number
  totalComments: number
}

export async function getBlogStats(): Promise<BlogStats> {
  const session = await getSession()
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'
  const currentUserId = session?.userId

  // Build where clause based on user role
  const where: any = {}
  if (!isAdmin) {
    // Non-admins only see their own posts
    where.authorId = currentUserId
  }

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    scheduledPosts,
    archivedPosts,
    featuredPosts,
    totalViews,
    totalComments,
  ] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.count({ where: { ...where, status: 'PUBLISHED' } }),
    prisma.blogPost.count({ where: { ...where, status: 'DRAFT' } }),
    prisma.blogPost.count({ where: { ...where, status: 'SCHEDULED' } }),
    prisma.blogPost.count({ where: { ...where, status: 'ARCHIVED' } }),
    prisma.blogPost.count({ where: { ...where, featured: true } }),
    // For views and comments, admins see all, users see their own posts' stats
    isAdmin
      ? prisma.blogPost.aggregate({ _sum: { viewCount: true } })
      : prisma.blogPost.aggregate({ where: { authorId: currentUserId }, _sum: { viewCount: true } }),
    isAdmin
      ? prisma.blogComment.count()
      : prisma.blogComment.count({
          where: {
            post: {
              authorId: currentUserId,
            },
          },
        }),
  ])

  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    scheduledPosts,
    archivedPosts,
    featuredPosts,
    totalViews: (totalViews._sum?.viewCount || 0) as number,
    totalComments: totalComments as number,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function logActivity(action: string, resourceType: string, resourceId: string, description: string) {
  const session = await getSession()
  if (!session) return

  try {
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: action as any,
        resourceType: resourceType as any,
        resourceId,
        description,
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

export async function incrementBlogPostView(slug: string) {
  await prisma.blogPost.update({
    where: { slug },
    data: {
      viewCount: {
        increment: 1
      }
    }
  })
}
