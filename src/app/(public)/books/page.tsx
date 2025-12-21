'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { BookCard } from '@/components/books/book-card'
import { SearchBar } from '@/components/books/search-bar'
import { PublicHeader } from '@/components/layout/public-header'
import { useBooks } from '@/hooks/use-books'
import {
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  BookOpen,
  Headphones,
  FileText
} from 'lucide-react'
import { type BookType } from '@prisma/client'

export default function BooksPage() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    type: searchParams?.get('type') || '',
    category: searchParams?.get('category') || '',
    author: searchParams?.get('author') || '',
    sortBy: searchParams?.get('sortBy') || 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    premium: 'all' as 'all' | 'free' | 'premium',
    page: 1,
    limit: 12
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: booksData, isLoading, error, refetch } = useBooks(filters)

  // Update filters when URL params change
  useEffect(() => {
    if (searchParams) {
      setFilters(prev => ({
        ...prev,
        search: searchParams.get('search') || '',
        type: searchParams.get('type') || '',
        category: searchParams.get('category') || '',
        author: searchParams.get('author') || '',
        sortBy: searchParams.get('sortBy') || 'createdAt',
        page: 1
      }))
    }
  }, [searchParams])

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }))
  }

  const handleSearch = (query: string) => {
    handleFilterChange('search', query)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      author: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      premium: 'all',
      page: 1,
      limit: 12
    })
  }

  const hasActiveFilters = filters.type || filters.category || filters.author || filters.premium !== 'all'

  const books = booksData?.data?.books || []
  const pagination = booksData?.data?.pagination

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Discover Books</h1>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <p className="text-muted-foreground">
              {booksData?.data?.pagination?.totalBooks || 0} books available
            </p>

            {/* Search Bar */}
            <div className="w-full lg:w-96">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search books, authors, or categories..."
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Book Type Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Book Type</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'EBOOK', label: 'Ebook', icon: FileText },
                      { value: 'AUDIO', label: 'Audiobook', icon: Headphones },
                      { value: 'HARD_COPY', label: 'Hard Copy', icon: BookOpen }
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Switch
                          id={type.value}
                          checked={filters.type === type.value}
                          onCheckedChange={(checked) =>
                            handleFilterChange('type', checked ? type.value : '')
                          }
                        />
                        <Label htmlFor={type.value} className="text-sm flex items-center gap-2 cursor-pointer">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Premium Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Access Level</Label>
                  <Select value={filters.premium} onValueChange={(value) => handleFilterChange('premium', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Books</SelectItem>
                      <SelectItem value="free">Free Books</SelectItem>
                      <SelectItem value="premium">Premium Books</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                  <div className="space-y-3">
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Latest Added</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="publishedDate">Published Date</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sortOrder"
                        checked={filters.sortOrder === 'asc'}
                        onCheckedChange={(checked) =>
                          handleFilterChange('sortOrder', checked ? 'asc' : 'desc')
                        }
                      />
                      <Label htmlFor="sortOrder" className="text-sm cursor-pointer">
                        Ascending Order
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Category Filter - Placeholder */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Categories</Label>
                  <div className="space-y-2">
                    {['Science Fiction', 'Romance', 'Mystery', 'Biography', 'Self-Help', 'Business'].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Switch
                          id={category.toLowerCase().replace(' ', '-')}
                          checked={filters.category === category.toLowerCase().replace(' ', '-')}
                          onCheckedChange={(checked) =>
                            handleFilterChange('category', checked ? category.toLowerCase().replace(' ', '-') : '')
                          }
                        />
                        <Label htmlFor={category.toLowerCase().replace(' ', '-')} className="text-sm cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Books Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6 flex flex-wrap gap-2">
                {filters.type && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Type: {filters.type.replace('_', ' ')}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange('type', '')}
                    />
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Category: {filters.category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange('category', '')}
                    />
                  </Badge>
                )}
                {filters.premium !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.premium === 'free' ? 'Free Only' : 'Premium Only'}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange('premium', 'all')}
                    />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-64 bg-muted rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Unable to load books. Please try again later.
                </p>
                <Button onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Books Display */}
            {!isLoading && !error && (
              <>
                {books.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No books found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or search terms
                    </p>
                    <Button onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {books.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        variant={viewMode === 'list' ? 'compact' : 'default'}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    const isCurrentPage = pageNum === filters.page

                    return (
                      <Button
                        key={pageNum}
                        variant={isCurrentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('page', pageNum)}
                        disabled={isCurrentPage}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}

                  {pagination.totalPages > 5 && (
                    <>
                      <span className="px-2 text-sm text-muted-foreground">...</span>
                      <Button
                        variant={filters.page === pagination.totalPages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('page', pagination.totalPages)}
                      >
                        {pagination.totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}