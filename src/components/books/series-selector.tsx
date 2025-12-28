'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Series {
  id: string
  name: string
}

interface SeriesAssignment {
  seriesId: string
  order: number
}

interface SeriesSelectorProps {
  value: SeriesAssignment[]
  onChange: (value: SeriesAssignment[]) => void
  series: Series[]
  disabled?: boolean
}

export function SeriesSelector({ value = [], onChange, series, disabled = false }: SeriesSelectorProps) {
  const [newSeriesId, setNewSeriesId] = useState<string>('')
  const [newOrder, setNewOrder] = useState<string>('')

  const handleAddSeries = () => {
    if (!newSeriesId || !newOrder) return

    const orderNum = parseFloat(newOrder)
    if (isNaN(orderNum) || orderNum <= 0) {
      alert('Please enter a valid order number (greater than 0)')
      return
    }

    // Check if series is already selected
    if (value.some(s => s.seriesId === newSeriesId)) {
      alert('This series is already added')
      return
    }

    onChange([...value, { seriesId: newSeriesId, order: orderNum }])
    setNewSeriesId('')
    setNewOrder('')
  }

  const handleRemoveSeries = (seriesId: string) => {
    onChange(value.filter(s => s.seriesId !== seriesId))
  }

  const handleUpdateOrder = (seriesId: string, newOrder: number) => {
    onChange(
      value.map(s =>
        s.seriesId === seriesId ? { ...s, order: newOrder } : s
      )
    )
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((assignment) => {
            const selectedSeries = series.find(s => s.id === assignment.seriesId)
            return (
              <div key={assignment.seriesId} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {selectedSeries?.name || 'Unknown Series'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Label htmlFor={`order-${assignment.seriesId}`} className="text-xs text-muted-foreground">
                      Order:
                    </Label>
                    <Input
                      id={`order-${assignment.seriesId}`}
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={assignment.order}
                      onChange={(e) => handleUpdateOrder(assignment.seriesId, parseFloat(e.target.value) || 0)}
                      className="h-7 w-24 text-xs"
                      disabled={disabled}
                    />
                    <span className="text-xs text-muted-foreground">
                      (decimals OK for prequels)
                    </span>
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handleRemoveSeries(assignment.seriesId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!disabled && (
        <div className="space-y-2 p-3 border rounded-lg border-dashed">
          <Select value={newSeriesId} onValueChange={setNewSeriesId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select series" />
            </SelectTrigger>
            <SelectContent>
              {series.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Order (e.g., 1, 1.5, 2)"
              value={newOrder}
              onChange={(e) => setNewOrder(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddSeries}
              disabled={!newSeriesId || !newOrder}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {value.length === 0 && !disabled && (
        <p className="text-sm text-muted-foreground">
          No series assigned. This book is a standalone work.
        </p>
      )}
    </div>
  )
}
