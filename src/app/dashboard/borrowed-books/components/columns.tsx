'use client'

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { Loan } from '../data/schema'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { format } from 'date-fns'
import { BookOpen, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/image-proxy'

export const columns: ColumnDef<Loan>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
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
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'bookName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Book" />
    ),
    cell: ({ row }) => {
      const loan = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="h-12 w-10 rounded bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
            {loan.bookImage ? (
              <img
                src={getProxiedImageUrl(loan.bookImage) || loan.bookImage}
                alt={loan.bookName}
                className="h-full w-full object-cover"
              />
            ) : (
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <LongText className="max-w-48 font-medium">{loan.bookName}</LongText>
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
  },
  {
    accessorKey: 'userName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Borrower" />
    ),
    cell: ({ row }) => {
      const loan = row.original
      return (
        <div className="space-y-1">
          <div className="font-medium">{loan.userName}</div>
          <div className="text-xs text-muted-foreground">{loan.userEmail}</div>
        </div>
      )
    },
    meta: { className: 'w-48' },
  },
  {
    accessorKey: 'loanDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Loan Date" />
    ),
    cell: ({ row }) => {
      const loanDate = row.getValue('loanDate') as string
      return (
        <div className="text-sm">
          {format(new Date(loanDate), 'MMM d, yyyy')}
        </div>
      )
    },
    meta: { className: 'w-32' },
  },
  {
    accessorKey: 'dueDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const loan = row.original
      return (
        <div className="text-sm">
          {format(new Date(loan.dueDate), 'MMM d, yyyy')}
        </div>
      )
    },
    meta: { className: 'w-32' },
  },
  {
    accessorKey: 'returnDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Return Date" />
    ),
    cell: ({ row }) => {
      const returnDate = row.getValue('returnDate') as string | null
      return returnDate ? (
        <div className="text-sm">
          {format(new Date(returnDate), 'MMM d, yyyy')}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">-</span>
      )
    },
    meta: { className: 'w-32' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
        ACTIVE: { variant: 'default', icon: <BookOpen className="h-3 w-3" />, label: 'Active' },
        OVERDUE: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" />, label: 'Overdue' },
        RETURNED: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" />, label: 'Returned' },
        CANCELLED: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Cancelled' },
      }
      const { variant, icon, label } = config[status] || config.CANCELLED
      return (
        <div className="flex items-center gap-1.5">
          {icon}
          <Badge variant={variant}>{label}</Badge>
        </div>
      )
    },
    meta: { className: 'w-28' },
  },
  {
    accessorKey: 'daysRemaining',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Days Left" />
    ),
    cell: ({ row }) => {
      const loan = row.original
      if (loan.status === 'RETURNED' || loan.status === 'CANCELLED') {
        return <span className="text-sm text-muted-foreground">-</span>
      }
      if (loan.isOverdue) {
        return (
          <span className="text-sm font-medium text-red-600">
            {Math.abs(loan.daysRemaining)}d overdue
          </span>
        )
      }
      if (loan.daysRemaining === 0) {
        return (
          <span className="text-sm font-medium text-orange-600">Due today</span>
        )
      }
      if (loan.daysRemaining === 1) {
        return (
          <span className="text-sm font-medium text-yellow-600">Tomorrow</span>
        )
      }
      return (
        <span className="text-sm">{loan.daysRemaining} days left</span>
      )
    },
    meta: { className: 'w-32' },
  },
]
