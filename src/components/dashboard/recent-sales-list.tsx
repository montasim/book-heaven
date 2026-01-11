'use client'

import { Avatar, AvatarFallback } from "../ui/avatar"

interface Sale {
  id: string
  name: string
  email: string
  amount: number
  initials: string
}

interface RecentSalesListProps {
  sales: Sale[]
}

export function RecentSalesList({ sales }: RecentSalesListProps) {
  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center gap-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{sale.initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-wrap items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{sale.name}</p>
              <p className="text-sm text-muted-foreground">
                {sale.email}
              </p>
            </div>
            <div className="font-medium">
              +৳{sale.amount.toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
