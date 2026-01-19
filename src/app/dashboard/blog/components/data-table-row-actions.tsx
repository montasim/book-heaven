'use client'

import { Row } from '@tanstack/react-table'
import { MoreHorizontal, Eye, Pencil, Star, StarOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { BlogPost } from '../actions'
import { useToast } from '@/hooks/use-toast'
import { deleteBlogPost, toggleFeaturedPost } from '../actions'
import { useState } from 'react'
import { useAuth } from '@/context/auth-context'

interface DataTableRowActionsProps {
  row: Row<BlogPost>
  onSuccess?: () => void
}

export function DataTableRowActions({ row, onSuccess }: DataTableRowActionsProps) {
  const post = row.original
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteBlogPost(post.id)
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      })
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog post',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleToggleFeatured = async () => {
    try {
      await toggleFeaturedPost(post.id)
      toast({
        title: 'Success',
        description: 'Post featured status updated',
      })
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update featured status',
        variant: 'destructive',
      })
    }
  }

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(`/blog/${post.slug}`)}>
            <Eye className='mr-2 h-4 w-4' />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/blog/${post.id}/edit`)}>
            <Pencil className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>
          {/* Only show Feature option for admins */}
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={handleToggleFeatured}>
                {post.featured ? (
                  <>
                    <StarOff className='mr-2 h-4 w-4' />
                    Unfeature
                  </>
                ) : (
                  <>
                    <Star className='mr-2 h-4 w-4' />
                    Feature
                  </>
                )}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setIsDeleteDialogOpen(true)
              }}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{post.title}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
