'use client'

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect } from '@/components/ui/multi-select'
import { BlogPost, createBlogPost, updateBlogPost, getBlogCategories, getBlogTags } from '../actions'
import { useToast } from '@/hooks/use-toast'
import { MDXEditor } from '@/components/ui/mdx-editor'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { BlogPostPreview } from './blog-post-preview'
import { useWatch } from 'react-hook-form'
import { useAuth } from '@/context/auth-context'

const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']),
  scheduledFor: z.date().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
})

type BlogPostFormValues = z.infer<typeof blogPostSchema>

interface BlogPostFormProps {
  post?: BlogPost
  postId?: string
}

export interface BlogPostFormRef {
  submit: () => void
}

export const BlogPostForm = forwardRef<BlogPostFormRef, BlogPostFormProps>(({ post, postId }, ref) => {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])


  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      excerpt: post?.excerpt || '',
      content: post?.content || '',
      coverImage: post?.coverImage || '',
      categoryId: post?.categoryId || '',
      tagIds: post?.tags.map(t => t.tag.id) || [],
      status: post?.status || 'DRAFT',
      scheduledFor: post?.scheduledFor || undefined,
      seoTitle: post?.seoTitle || '',
      seoDescription: post?.seoDescription || '',
      seoKeywords: post?.seoKeywords || [],
      featured: isAdmin ? (post?.featured || false) : false,
      allowComments: isAdmin ? (post?.allowComments ?? true) : true,
    },
  })

  // Watch form values for live preview
  const formValues = useWatch({
    control: form.control,
    name: ['title', 'excerpt', 'content', 'coverImage', 'featured', 'categoryId', 'tagIds'],
  })

  // Get category name
  const categoryName = categories.find(c => c.id === formValues[5])?.name

  // Get tag names
  const tagNames = (formValues[6] || [])
    .map((tagId: string) => tags.find(t => t.id === tagId)?.name)
    .filter(Boolean)

  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [])

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

  // Expose submit method via ref
  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(onSubmit)()
    }
  }))

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    form.setValue('title', title)
    if (!post) {
      // Only auto-generate slug for new posts
      form.setValue('slug', generateSlug(title))
    }
  }

  // Auto-generate SEO from content
  const generateSEO = (title: string, excerpt: string, content: string, categoryTags: string[]) => {
    // Generate SEO title (use title or truncate)
    const seoTitle = title.length > 60 ? title.substring(0, 57) + '...' : title

    // Generate meta description from excerpt or content
    const descriptionText = excerpt || content.replace(/[#*`_\[\]]/g, '').substring(0, 160)
    const seoDescription = descriptionText.length > 160
      ? descriptionText.substring(0, 157) + '...'
      : descriptionText

    // Generate keywords from category tags
    const seoKeywords = categoryTags.length > 0 ? categoryTags : ['blog', 'article']

    return { seoTitle, seoDescription, seoKeywords }
  }

  const onSubmit = async (values: BlogPostFormValues) => {
    setLoading(true)
    try {
      // Get tag names for SEO keywords
      const tagNames = (values.tagIds || [])
        .map(tagId => tags.find(t => t.id === tagId)?.name)
        .filter(Boolean) as string[]

      // Auto-generate SEO for all users
      const autoSEO = generateSEO(
        values.title,
        values.excerpt || '',
        values.content,
        tagNames
      )

      const data = {
        ...values,
        tagIds: values.tagIds || [],
        // Use auto-generated SEO
        seoTitle: autoSEO.seoTitle,
        seoDescription: autoSEO.seoDescription,
        seoKeywords: autoSEO.seoKeywords,
        // Force featured and allowComments for non-admin users
        featured: isAdmin ? values.featured : false,
        allowComments: isAdmin ? values.allowComments : true,
      }

      if (postId) {
        await updateBlogPost(postId, data)
        toast({
          title: 'Success',
          description: 'Blog post updated successfully',
        })
      } else {
        await createBlogPost(data)
        toast({
          title: 'Success',
          description: 'Blog post created successfully',
        })
      }

      router.push('/dashboard/blog')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save blog post',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-2 gap-4">
        {/* Left Column - Form */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter an engaging title for your post"
                      {...field}
                      onChange={(e) => handleTitleChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Content</FormLabel>
                  <FormControl>
                    <MDXEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Write your blog post content here... (Markdown supported)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Excerpt */}
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief summary to appear in post listings..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A short preview that appears in blog listings and social media
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image */}
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a URL for your cover image (e.g., from Unsplash, Pexels, or your own hosting)
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={categories.map(category => ({
                        label: category.name,
                        value: category.id,
                      }))}
                      selected={field.value ? [field.value] : []}
                      onChange={(values) => field.onChange(values[0] || '')}
                      placeholder="Select a category"
                      emptyText="No categories found"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={tags.map(tag => ({
                        label: tag.name,
                        value: tag.id,
                      }))}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select tags"
                      emptyText="No tags available"
                    />
                  </FormControl>
                  <FormDescription className="mt-1">Select relevant tags for this post</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Divider */}
            <div className="border-t" />

            {/* Advanced Settings */}
              {/* URL Slug */}
              <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                              <Input placeholder="post-url-slug" {...field} />
                          </FormControl>
                          <FormDescription>
                              The URL-friendly version (auto-generated from title)
                          </FormDescription>
                          <FormMessage />
                      </FormItem>
                  )}
              />

              {/* Status */}
              <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="DRAFT">Draft</SelectItem>
                                  <SelectItem value="PUBLISHED">Published</SelectItem>
                                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                      </FormItem>
                  )}
              />

              {/* Scheduled Date */}
              {form.watch('status') === 'SCHEDULED' && (
                  <FormField
                      control={form.control}
                      name="scheduledFor"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Scheduled Date</FormLabel>
                              <FormControl>
                                  <Popover>
                                      <PopoverTrigger asChild>
                                          <Button
                                              variant="outline"
                                              className="w-full justify-start text-left font-normal"
                                          >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                          </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                              mode="single"
                                              selected={field.value}
                                              onSelect={field.onChange}
                                              disabled={(date) => date < new Date()}
                                          />
                                      </PopoverContent>
                                  </Popover>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              )}

              {/* Admin-only settings */}
              {isAdmin && (
                  <div className="flex gap-4">
                      <FormField
                          control={form.control}
                          name="featured"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                                  <div className="space-y-0.5">
                                      <FormLabel>Featured</FormLabel>
                                      <FormDescription className="text-xs">
                                          Show in featured sections
                                      </FormDescription>
                                  </div>
                                  <FormControl>
                                      <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                      />
                                  </FormControl>
                              </FormItem>
                          )}
                      />

                      <FormField
                          control={form.control}
                          name="allowComments"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                                  <div className="space-y-0.5">
                                      <FormLabel>Comments</FormLabel>
                                      <FormDescription className="text-xs">
                                          Allow reader comments
                                      </FormDescription>
                                  </div>
                                  <FormControl>
                                      <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                      />
                                  </FormControl>
                              </FormItem>
                          )}
                      />
                  </div>
              )}
          </CardContent>
        </Card>

        {/* Right Column - Preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          <BlogPostPreview
            title={formValues[0] || 'Post Title'}
            excerpt={formValues[1]}
            content={formValues[2] || ''}
            coverImage={formValues[3]}
            categoryName={categoryName}
            tags={tagNames}
            authorName={user?.name || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Your Name')}
            authorImage={(user?.avatar || user?.directAvatarUrl) ?? undefined}
            authorBio={user?.bio ?? undefined}
            publishedAt={post?.publishedAt || undefined}
            readTime={post?.readTime || undefined}
            featured={formValues[4] || false}
          />
        </div>
      </form>
    </Form>
  )
})

BlogPostForm.displayName = 'BlogPostForm'
