'use client'

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { callTypes, userTypes } from '../data/data'
import { User } from '../data/schema'
import { getUserDisplayName } from '@/lib/utils/user'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

// Helper function to format dates
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const columns: ColumnDef<User>[] = [
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
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Username' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('username')}</LongText>
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
    id: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const { firstName, lastName, username, name, email } = row.original
      const fullName = getUserDisplayName({ firstName, lastName, username, name, email })
      return <LongText className='max-w-36'>{fullName}</LongText>
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone Number' />
    ),
    cell: ({ row }) => <div>{row.getValue('phoneNumber')}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const { status } = row.original
      const badgeColor = callTypes.get(status)
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {row.getValue('status')}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const { role } = row.original
      const userType = userTypes.find(({ value }) => value === role)

      if (!userType) {
        return null
      }

      return (
        <div className='flex gap-x-2 items-center'>
          {userType.icon && (
            <userType.icon size={16} className='text-muted-foreground' />
          )}
          <span className='capitalize text-sm'>{row.getValue('role')}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'subscriptionPlan',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Plan' />
    ),
    cell: ({ row }) => {
      const plan = (row.getValue('subscriptionPlan') as string | undefined) || 'FREE'
      const planColors: Record<string, string> = {
        FREE: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        PREMIUM: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        PREMIUM_PLUS: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      }
      const isPremium = row.original.isPremium
      return (
        <div className='flex items-center gap-2'>
          {isPremium && <span className='text-lg'>💎</span>}
          <Badge variant='outline' className={cn('capitalize', planColors[plan] || planColors['FREE'])}>
            {plan}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id) || 'FREE')
    },
  },
  {
    accessorKey: 'subscriptionIsActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sub Status' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('subscriptionIsActive')
      const cancelAtEnd = row.original.cancelAtPeriodEnd
      if (isActive === undefined || isActive === null) {
        return <span className='text-muted-foreground'>-</span>
      }
      return (
        <div className='flex items-center gap-2'>
          <Badge variant={isActive ? 'default' : 'secondary'} className='capitalize'>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
          {cancelAtEnd && (
            <span className='text-xs text-muted-foreground' title='Cancels at period end'>
              Ending Soon
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id)
      if (isActive === undefined || isActive === null) return value.includes('none')
      return value.includes(isActive ? 'active' : 'inactive')
    },
  },
  {
    accessorKey: 'subscriptionStartDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Start Date' />
    ),
    cell: ({ row }) => {
      return <span className='text-sm'>{formatDate(row.getValue('subscriptionStartDate'))}</span>
    },
  },
  {
    accessorKey: 'subscriptionEndDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='End Date' />
    ),
    cell: ({ row }) => {
      const endDate = row.getValue('subscriptionEndDate')
      return <span className='text-sm'>{formatDate(endDate as string | undefined)}</span>
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
