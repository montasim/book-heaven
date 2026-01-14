'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPostForm } from '../components/blog-post-form'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { FileText, X } from 'lucide-react'

export default function NewBlogPostPage() {
  const router = useRouter()
  const formRef = useRef<{ submit: () => void }>(null)

  return (
    <DashboardPage
      icon={FileText}
      title="Create New Post"
      description="Write and publish a new blog post"
      actions={[
        {
          label: 'Create Post',
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
      <BlogPostForm ref={formRef} />
    </DashboardPage>
  )
}
