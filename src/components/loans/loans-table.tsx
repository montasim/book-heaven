'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, BookOpen, Calendar, CheckCircle, Clock, AlertTriangle, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getProxiedImageUrl } from '@/lib/image-proxy'

interface Book {
  id: string
  name: string
  image: string | null
  type: string
}

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string
}

interface LentBy {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
}

interface Loan {
  id: string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED'
  notes: string | null
  book: Book
  user: User
  lentBy: LentBy
}

interface LoansTableProps {
  className?: string
}

export function LoansTable({ className }: LoansTableProps) {
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [returningId, setReturningId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchLoans = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/loans')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch loans')
      }

      setLoans(data.data.loans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const handleReturn = async (loanId: string) => {
    setReturningId(loanId)
    setError(null)

    try {
      const response = await fetch(`/api/loans/${loanId}/return`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to return book')
      }

      await fetchLoans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return book')
    } finally {
      setReturningId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-blue-500">Active</Badge>
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>
      case 'RETURNED':
        return <Badge variant="outline" className="border-green-500 text-green-700">Returned</Badge>
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'RETURNED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUserName = (user: User | LentBy) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.email
  }

  const isLoanActive = (status: string) => {
    return status === 'ACTIVE' || status === 'OVERDUE'
  }

  // Filter loans
  const filteredLoans = loans.filter(loan => {
    const matchesSearch =
      searchQuery === '' ||
      loan.book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getUserName(loan.user).toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || loan.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeCount = loans.filter(l => isLoanActive(l.status)).length
  const overdueCount = loans.filter(l => l.status === 'OVERDUE').length

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Loans Management</CardTitle>
              <CardDescription>
                {activeCount} active loan{activeCount !== 1 ? 's' : ''},
                {overdueCount} overdue
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by book, user, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Loans Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'No loans match your filters.'
                  : 'No loans have been created yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLoans.map((loan) => {
                const daysRemaining = getDaysRemaining(loan.dueDate)
                const isOverdue = daysRemaining < 0
                const isActive = isLoanActive(loan.status)

                return (
                  <div
                    key={loan.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                      isOverdue && "border-red-200 bg-red-50 dark:bg-red-900/10"
                    )}
                  >
                    {/* Book Image */}
                    <div className="flex-shrink-0">
                      <div className="h-16 w-12 rounded bg-accent flex items-center justify-center overflow-hidden">
                        {loan.book.image ? (
                          <img
                            src={getProxiedImageUrl(loan.book.image) || loan.book.image}
                            alt={loan.book.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h5 className="font-medium line-clamp-1">{loan.book.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(loan.status)}
                            {getStatusBadge(loan.status)}
                          </div>
                        </div>
                        {isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleReturn(loan.id)}
                            disabled={returningId === loan.id}
                          >
                            {returningId === loan.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Returning...
                              </>
                            ) : (
                              'Mark Returned'
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Borrower:</span>
                          <span>{getUserName(loan.user)}</span>
                          <span className="text-xs">({loan.user.email})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Borrowed: {format(new Date(loan.loanDate), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {format(new Date(loan.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        {isActive && (
                          <div>
                            {isOverdue ? (
                              <span className="text-red-600 font-medium">
                                {Math.abs(daysRemaining)} days overdue
                              </span>
                            ) : daysRemaining === 0 ? (
                              <span className="text-orange-600 font-medium">Due today</span>
                            ) : daysRemaining === 1 ? (
                              <span className="text-yellow-600 font-medium">Due tomorrow</span>
                            ) : (
                              <span>{daysRemaining} days left</span>
                            )}
                          </div>
                        )}
                        {loan.returnDate && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>Returned: {format(new Date(loan.returnDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {loan.notes && (
                          <p className="italic text-xs">
                            "{loan.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
