'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { BlogPost, PostStatus } from '../actions'
import { Star, MessageCircle, MessageCircleOff } from 'lucide-react'
import { formatDate } from '@/lib/utils/format-date'

const statusBadgeVariants: Record<PostStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PUBLISHED: 'default',
  DRAFT: 'secondary',
  SCHEDULED: 'outline',
  ARCHIVED: 'destructive',
}

export function getColumns(onSuccess?: () => void): ColumnDef<BlogPost>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
          className='translate-y-[2px]'
        />
      ),
      meta: {
        className: cn(
          'sticky md:table-cell left-0 z-10 rounded-tl',
          'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
        ),
      },
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Title' />
      ),
      cell: ({ row }) => {
        const featured = row.original.featured
        return (
          <div className='flex items-center gap-2'>
            {featured && <Star className='h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0' />}
            <LongText className='max-w-48'>{row.getValue('title')}</LongText>
          </div>
        )
      },
      meta: {
        className: cn(
          'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none',
          'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
          'sticky left-6 md:table-cell'
        ),
      },
      enableHiding: false,
    },
    {
      accessorKey: 'author',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Author' />
      ),
      cell: ({ row }) => {
        const author = row.original.author
        return (
          <span className='text-sm'>
            {author.name || `${author.firstName} ${author.lastName || ''}`.trim()}
          </span>
        )
      },
    },
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Category' />
      ),
      cell: ({ row }) => {
        const category = row.original.category
        return category ? (
          <Link href={`/blog?category=${category.id}`}>
            <Badge variant='outline' className='hover:underline cursor-pointer'>
              {category.name}
            </Badge>
          </Link>
        ) : (
          <span className='text-muted-foreground text-sm'>-</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as PostStatus
        return (
          <Badge variant={statusBadgeVariants[status]}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'viewCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Views' />
      ),
      cell: ({ row }) => row.getValue('viewCount'),
    },
    {
      accessorKey: 'allowComments',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Comments' />
      ),
      cell: ({ row }) => {
        const allowComments = row.getValue('allowComments') as boolean
        return allowComments ? (
          <div className='flex items-center gap-1 text-green-600'>
            <MessageCircle className='h-4 w-4' />
            <span className='text-sm'>Enabled</span>
          </div>
        ) : (
          <div className='flex items-center gap-1 text-muted-foreground'>
            <MessageCircleOff className='h-4 w-4' />
            <span className='text-sm'>Disabled</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'publishedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Published Date' />
      ),
      cell: ({ row }) => {
        const publishedAt = row.getValue('publishedAt') as Date | null
        return publishedAt ? formatDate(publishedAt) : '-'
      },
    },
    {
      id: 'actions',
      cell: (props) => <DataTableRowActions {...props} onSuccess={onSuccess} />,
    },
  ]
}
