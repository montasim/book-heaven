'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPostForm } from '../../components/blog-post-form'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { FileText, X } from 'lucide-react'
import { BlogPost } from '../../actions'

interface EditBlogPostFormProps {
  post: BlogPost
  postId: string
}

export function EditBlogPostForm({ post, postId }: EditBlogPostFormProps) {
  const router = useRouter()
  const formRef = useRef<{ submit: () => void }>(null)

  return (
    <DashboardPage
      icon={FileText}
      title="Edit Post"
      description="Make changes to your blog post"
      actions={[
        {
          label: 'Update Post',
          icon: FileText,
          onClick: () => formRef.current?.submit(),
        },
        {
          label: 'Cancel',
          icon: X,
          onClick: () => router.back(),
          variant: 'outline',
        },
      ]}
    >
      <BlogPostForm ref={formRef} post={post} postId={postId} />
    </DashboardPage>
  )
}
