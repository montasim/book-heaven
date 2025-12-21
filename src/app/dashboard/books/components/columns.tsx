'use client'

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { Book } from '../data/schema'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { BookOpen, HardDrive, Headphones } from 'lucide-react'

const bookTypeIcons = {
  HARD_COPY: HardDrive,
  EBOOK: BookOpen,
  AUDIO: Headphones,
}

const bookTypeLabels = {
  HARD_COPY: 'Hard Copy',
  EBOOK: 'eBook',
  AUDIO: 'Audio',
}

export const columns: ColumnDef<Book>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Book Name' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <LongText className='max-w-48'>{row.getValue('name')}</LongText>
      </div>
    ),
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
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as keyof typeof bookTypeIcons
      const Icon = bookTypeIcons[type]
      return (
        <Badge variant='outline' className='capitalize flex items-center gap-1'>
          <Icon className='h-3 w-3' />
          {bookTypeLabels[type]}
        </Badge>
      )
    },
    meta: { className: 'w-24' },
  },
  {
    accessorKey: 'authors',
    header: 'Authors',
    cell: ({ row }) => {
      const authors = (row.original as any).authors || []
      return (
        <div className='flex flex-wrap gap-1 max-w-48'>
          {authors.slice(0, 2).map((author: any, index: number) => (
            <Badge key={index} variant='secondary' className='text-xs'>
              {author.name}
            </Badge>
          ))}
          {authors.length > 2 && (
            <Badge variant='secondary' className='text-xs'>
              +{authors.length - 2} more
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'publications',
    header: 'Publications',
    cell: ({ row }) => {
      const publications = (row.original as any).publications || []
      return (
        <div className='flex flex-wrap gap-1 max-w-48'>
          {publications.slice(0, 2).map((pub: any, index: number) => (
            <Badge key={index} variant='outline' className='text-xs'>
              {pub.name}
            </Badge>
          ))}
          {publications.length > 2 && (
            <Badge variant='outline' className='text-xs'>
              +{publications.length - 2} more
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'categories',
    header: 'Categories',
    cell: ({ row }) => {
      const categories = (row.original as any).categories || []
      return (
        <div className='flex flex-wrap gap-1 max-w-48'>
          {categories.slice(0, 2).map((category: any, index: number) => (
            <Badge key={index} variant='default' className='text-xs'>
              {category.name}
            </Badge>
          ))}
          {categories.length > 2 && (
            <Badge variant='default' className='text-xs'>
              +{categories.length - 2} more
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'numberOfCopies',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Copies' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const copies = row.getValue('numberOfCopies')

      if (type === 'HARD_COPY') {
        return (
          <Badge variant='secondary'>
            {copies || 0} copies
          </Badge>
        )
      }

      return (
        <Badge variant='outline' className='text-muted-foreground'>
          N/A
        </Badge>
      )
    },
    meta: { className: 'w-20' },
  },
  {
    accessorKey: 'entryDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Entry Date' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('entryDate'))
      return <div className='text-sm'>{date.toLocaleDateString()}</div>
    },
    meta: { className: 'w-32' },
  },
  {
    accessorKey: 'entryBy',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Entry By' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-32'>{row.getValue('entryBy')}</LongText>
    ),
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    meta: {
      className: cn(
        'sticky right-0 bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'rounded-tr'
      ),
    },
  },
]