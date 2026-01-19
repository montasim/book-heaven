'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { Publication } from '../data/schema'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<Publication>[] = [
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
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <Link href={`/dashboard/publications/${row.original.id}`} className='hover:underline'>
        <LongText className='max-w-36'>{row.getValue('name')}</LongText>
      </Link>
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
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      return (
        <LongText className='max-w-48'>
          {description || 'No description'}
        </LongText>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'bookCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Books' />
    ),
    cell: ({ row }) => {
      const bookCount = (row.original as any).bookCount || 0
      return (
        <Badge variant='secondary' className='capitalize'>
          {bookCount} books
        </Badge>
      )
    },
    meta: { className: 'w-24' },
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