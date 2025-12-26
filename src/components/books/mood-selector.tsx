'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface Mood {
  id: string
  name: string
  emoji: string
  description: string
  categories: string[]
  color: string
}

const MOODS: Mood[] = [
  {
    id: 'happy',
    name: 'Happy',
    emoji: '😊',
    description: 'Feel-good stories and uplifting content',
    categories: ['romance', 'self-help', 'comedy', 'fantasy'],
    color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-700',
  },
  {
    id: 'adventurous',
    name: 'Adventurous',
    emoji: '🚀',
    description: 'Explore new worlds and exciting journeys',
    categories: ['science-fiction', 'fantasy', 'thriller', 'mystery'],
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-700',
  },
  {
    id: 'romantic',
    name: 'Romantic',
    emoji: '💕',
    description: 'Love stories and heartwarming tales',
    categories: ['romance'],
    color: 'bg-pink-100 hover:bg-pink-200 border-pink-300 dark:bg-pink-900/20 dark:hover:bg-pink-900/30 dark:border-pink-700',
  },
  {
    id: 'mysterious',
    name: 'Mysterious',
    emoji: '🔍',
    description: 'Solve puzzles and uncover secrets',
    categories: ['mystery', 'thriller'],
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-300 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:border-purple-700',
  },
  {
    id: 'inspired',
    name: 'Inspired',
    emoji: '✨',
    description: 'Motivational and empowering reads',
    categories: ['self-help', 'business', 'biography'],
    color: 'bg-green-100 hover:bg-green-200 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-700',
  },
  {
    id: 'nostalgic',
    name: 'Nostalgic',
    emoji: '📖',
    description: 'Classic tales and historical journeys',
    categories: ['history', 'classics', 'biography'],
    color: 'bg-amber-100 hover:bg-amber-200 border-amber-300 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:border-amber-700',
  },
  {
    id: 'relaxed',
    name: 'Relaxed',
    emoji: '😌',
    description: 'Calm and peaceful reading material',
    categories: ['poetry', 'art', 'self-help'],
    color: 'bg-teal-100 hover:bg-teal-200 border-teal-300 dark:bg-teal-900/20 dark:hover:bg-teal-900/30 dark:border-teal-700',
  },
  {
    id: 'curious',
    name: 'Curious',
    emoji: '🤔',
    description: 'Learn something new and fascinating',
    categories: ['science', 'history', 'business', 'self-help'],
    color: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:border-indigo-700',
  },
]

interface MoodSelectorProps {
  onSelectMood: (mood: Mood) => void
  selectedMood?: Mood | null
}

export function MoodSelector({ onSelectMood, selectedMood }: MoodSelectorProps) {
  const [hoveredMood, setHoveredMood] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">How are you feeling today?</h3>
        <p className="text-muted-foreground">Select your mood and we'll suggest the perfect books for you</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {MOODS.map((mood) => (
          <Card
            key={mood.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
              selectedMood?.id === mood.id
                ? 'ring-2 ring-primary ring-offset-2 ' + mood.color
                : mood.color
            }`}
            onMouseEnter={() => setHoveredMood(mood.id)}
            onMouseLeave={() => setHoveredMood(null)}
            onClick={() => onSelectMood(mood)}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{mood.emoji}</div>
                <h4 className="font-semibold mb-1">{mood.name}</h4>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {mood.description}
                </p>
                {(hoveredMood === mood.id || selectedMood?.id === mood.id) && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {mood.categories.slice(0, 2).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                    {mood.categories.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{mood.categories.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMood && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectMood(null as any)}
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  )
}

export { MOODS }
export type { Mood }
