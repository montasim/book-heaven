'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ResetIcon } from '@radix-ui/react-icons'
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter'

interface LibraryFilterToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  readingStatus: string[]
  onReadingStatusChange: (value: string[]) => void
  authors: string[]
  selectedAuthors: string[]
  onAuthorsChange: (value: string[]) => void
  onReset: () => void
  bookCount: number
}

const readingStatusOptions = [
  { label: "Not Started", value: "not-started" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
]

export function LibraryFilterToolbar({
  searchValue,
  onSearchChange,
  readingStatus,
  onReadingStatusChange,
  authors,
  selectedAuthors,
  onAuthorsChange,
  onReset,
  bookCount,
}: LibraryFilterToolbarProps) {
  const activeFilters = [
    readingStatus.length > 0,
    selectedAuthors.length > 0,
  ].filter(Boolean).length

  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex flex-1 items-center gap-2">
        {/* Search Input */}
        <Input
          placeholder="Search books..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-[150px] sm:w-[250px]"
        />

        {/* Reading Status Filter */}
        <DataTableFacetedFilter
          title="Status"
          options={readingStatusOptions}
          selected={readingStatus}
          onChange={onReadingStatusChange}
        />

        {/* Authors Filter */}
        {authors.length > 0 && (
          <DataTableFacetedFilter
            title="Authors"
            options={authors.map(a => ({ label: a, value: a }))}
            selected={selectedAuthors}
            onChange={onAuthorsChange}
          />
        )}

        {/* Reset Button */}
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={onReset}
          >
            <ResetIcon className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Book Count Badge */}
      <div className="text-sm text-muted-foreground hidden sm:block">
        {bookCount} {bookCount === 1 ? 'book' : 'books'}
      </div>
    </div>
  )
}
