'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { BlogComment, getBlogComments, createBlogComment } from '@/app/dashboard/blog/actions'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { formatDate } from '@/lib/utils/format-date'
import { Loader2, MessageCircle, User as UserIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BlogCommentsSectionProps {
  postId: string
  postSlug: string
}

export function BlogCommentsSection({ postId, postSlug }: BlogCommentsSectionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const result = await getBlogComments({ postId })
      setComments(result.comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to comment',
        variant: 'destructive',
      })
      return
    }

    if (!newComment.trim()) {
      return
    }

    setSubmitting(true)
    try {
      await createBlogComment(postId, newComment.trim())
      setNewComment('')
      toast({
        title: 'Comment posted',
        description: 'Your comment has been published successfully',
      })
      fetchComments()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit comment',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to reply',
        variant: 'destructive',
      })
      return
    }

    if (!replyContent.trim()) {
      return
    }

    setSubmitting(true)
    try {
      await createBlogComment(postId, replyContent.trim(), parentId)
      setReplyContent('')
      setReplyTo(null)
      toast({
        title: 'Reply posted',
        description: 'Your reply has been published successfully',
      })
      fetchComments()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit reply',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="space-y-6">
      <h2 className="text-md font-bold flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      <div className="space-y-4">
        <Textarea
          placeholder={user ? "Write a comment..." : "Log in to comment..."}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user || submitting}
          rows={4}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={!user || !newComment.trim() || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Comment
          </Button>
        </div>
      </div>

      <Separator />

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
          <p className="text-muted-foreground">Be the first to share your thoughts!</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* Main Comment */}
              <div className="flex gap-4">
                <Avatar>
                  {comment.author.avatar ? (
                    <AvatarImage src={getProxiedImageUrl(comment.author.avatar) || comment.author.avatar} />
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {comment.author.name || `${comment.author.firstName} ${comment.author.lastName || ''}`.trim()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    >
                      Reply
                    </Button>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {replyTo === comment.id && (
                <div className="ml-14 space-y-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={submitting}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim() || submitting}
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyTo(null)
                        setReplyContent('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-14 space-y-4">
                  <Separator />
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        {reply.author.avatar ? (
                          <AvatarImage src={getProxiedImageUrl(reply.author.avatar) || reply.author.avatar} />
                        ) : (
                          <AvatarFallback className="bg-muted">
                            <UserIcon className="h-3 w-3 text-muted-foreground" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {reply.author.name || `${reply.author.firstName} ${reply.author.lastName || ''}`.trim()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
