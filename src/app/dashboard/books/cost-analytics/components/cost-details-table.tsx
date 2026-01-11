'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CostDetailItem } from '@/types/book-cost-analytics'
import { BookType } from '@prisma/client'

interface CostDetailsTableProps {
  items: CostDetailItem[]
  isAdmin?: boolean
}

export function CostDetailsTable({ items, isAdmin = false }: CostDetailsTableProps) {
  const getBookTypeBadge = (type: BookType) => {
    switch (type) {
      case BookType.HARD_COPY:
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Hard Copy</span>
      case BookType.EBOOK:
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">E-Book</span>
      case BookType.AUDIO:
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Audio</span>
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">Unknown</span>
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No cost data available
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Book Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Buying Price</TableHead>
            <TableHead className="text-right">Copies</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
            <TableHead>Purchase Date</TableHead>
            <TableHead>Authors</TableHead>
            <TableHead>Categories</TableHead>
            {isAdmin && <TableHead>Entry By</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.bookId}>
              <TableCell className="font-medium">{item.bookName}</TableCell>
              <TableCell>{getBookTypeBadge(item.bookType)}</TableCell>
              <TableCell className="text-right">
                {item.buyingPrice ? `৳${item.buyingPrice.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell className="text-right">{item.numberOfCopies || 1}</TableCell>
              <TableCell className="text-right font-semibold">
                ৳{item.totalCost.toFixed(2)}
              </TableCell>
              <TableCell>
                {item.purchaseDate
                  ? new Date(item.purchaseDate).toLocaleDateString()
                  : 'Not set'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.authors.slice(0, 2).map((author) => (
                    <span
                      key={author.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted"
                    >
                      {author.name}
                    </span>
                  ))}
                  {item.authors.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{item.authors.length - 2} more
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.categories.slice(0, 2).map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted"
                    >
                      {category.name}
                    </span>
                  ))}
                  {item.categories.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{item.categories.length - 2} more
                    </span>
                  )}
                </div>
              </TableCell>
              {isAdmin && (
                <TableCell>
                  {item.entryBy?.name || item.entryBy?.firstName || item.entryBy?.lastName || 'Unknown'}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
