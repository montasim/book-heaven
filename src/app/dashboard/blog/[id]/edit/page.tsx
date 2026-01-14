import { notFound } from 'next/navigation'
import { EditBlogPostForm } from './edit-blog-post-form'
import { getBlogPostById } from '../../actions'

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let post
  try {
    post = await getBlogPostById(id)
  } catch (error) {
    notFound()
  }

  return <EditBlogPostForm post={post} postId={id} />
}
