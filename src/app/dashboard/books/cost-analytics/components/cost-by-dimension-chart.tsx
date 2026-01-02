'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { CostByDimensionData, GroupByType } from '@/types/book-cost-analytics'

interface CostByDimensionChartProps {
  data: CostByDimensionData[]
  groupBy: GroupByType
  onGroupByChange: (groupBy: GroupByType) => void
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
        <p className="font-medium">{payload[0].payload.name}</p>
        <p style={{ color: payload[0].color }}>
          Total: ${payload[0].value.toFixed(2)}
        </p>
        <p className="text-muted-foreground">
          {payload[0].payload.bookCount} books
        </p>
      </div>
    )
  }
  return null
}

const groupByOptions: { value: GroupByType; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'author', label: 'Author' },
  { value: 'publication', label: 'Publication' },
]

export function CostByDimensionChart({ data, groupBy, onGroupByChange }: CostByDimensionChartProps) {
  const chartData = data.map(item => ({
    name: item.name,
    total: item.totalCost,
    bookCount: item.bookCount,
  }))

  const getTitle = () => {
    switch (groupBy) {
      case 'category':
        return 'Costs by Category'
      case 'author':
        return 'Costs by Author'
      case 'publication':
        return 'Costs by Publication'
      default:
        return 'Costs by Dimension'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{getTitle()}</CardTitle>
          <div className="flex gap-1">
            {groupByOptions.map((option) => (
              <Button
                key={option.value}
                variant={groupBy === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onGroupByChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No cost data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
