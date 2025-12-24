import { Badge } from '@/components/ui/badge'
import { User, Building2, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RecommendationType = 'author' | 'publication' | 'category'

interface RecommendationBadgeProps {
  type: RecommendationType
  names: string[]
  className?: string
}

export function RecommendationBadge({ type, names, className }: RecommendationBadgeProps) {
  if (names.length === 0) return null

  const getIcon = () => {
    switch (type) {
      case 'author':
        return <User className="h-3 w-3" />
      case 'publication':
        return <Building2 className="h-3 w-3" />
      case 'category':
        return <Tag className="h-3 w-3" />
    }
  }

  const getLabel = () => {
    if (names.length === 1) {
      return names[0]
    }
    return `${names[0]} +${names.length - 1}`
  }

  const getVariant = () => {
    switch (type) {
      case 'author':
        return 'default' as const
      case 'publication':
        return 'secondary' as const
      case 'category':
        return 'outline' as const
    }
  }

  return (
    <Badge variant={getVariant()} className={cn("text-xs gap-1.5", className)}>
      {getIcon()}
      <span>{getLabel()}</span>
    </Badge>
  )
}

interface RecommendationReasonsProps {
  reasons: {
    authors?: string[]
    publications?: string[]
    categories?: string[]
  }
  className?: string
}

export function RecommendationReasons({ reasons, className }: RecommendationReasonsProps) {
  const hasReasons =
    (reasons.authors && reasons.authors.length > 0) ||
    (reasons.publications && reasons.publications.length > 0) ||
    (reasons.categories && reasons.categories.length > 0)

  if (!hasReasons) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-xs text-muted-foreground">Because:</span>
      {reasons.authors && reasons.authors.length > 0 && (
        <RecommendationBadge type="author" names={reasons.authors} />
      )}
      {reasons.publications && reasons.publications.length > 0 && (
        <RecommendationBadge type="publication" names={reasons.publications} />
      )}
      {reasons.categories && reasons.categories.length > 0 && (
        <RecommendationBadge type="category" names={reasons.categories} />
      )}
    </div>
  )
}
