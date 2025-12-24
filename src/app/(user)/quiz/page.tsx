'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { QuizSetup } from '@/components/quiz/quiz-setup'
import { QuizGame } from '@/components/quiz/quiz-game'
import { QuizResults } from '@/components/quiz/quiz-results'
import { QuizLeaderboard } from '@/components/quiz/quiz-leaderboard'
import { QuizStats } from '@/components/quiz/quiz-stats'

type QuizState = 'setup' | 'playing' | 'results'

interface QuizConfig {
  category: string
  categoryName: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: 5 | 10 | 15
}

interface QuizData {
  questions: Array<{
    category: string
    type: string
    difficulty: string
    question: string
    correct_answer: string
    incorrect_answers: string[]
    allAnswers: string[]
  }>
}

export default function QuizPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [quizState, setQuizState] = useState<QuizState>('setup')
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null)
  const [quizData, setQuizData] = useState<QuizData | null>(null)

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/login')
    return null
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const handleStartQuiz = (config: QuizConfig, data: QuizData) => {
    setQuizConfig(config)
    setQuizData(data)
    setQuizState('playing')
  }

  const handleQuizComplete = () => {
    setQuizState('results')
  }

  const handlePlayAgain = () => {
    setQuizState('setup')
    setQuizConfig(null)
    setQuizData(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Quiz Game</h1>
            <p className="text-muted-foreground">
              Test your knowledge and climb the leaderboard!
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Game Tabs */}
      <Tabs defaultValue="play" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="play">Play Quiz</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="stats">My Stats</TabsTrigger>
        </TabsList>

        {/* Play Quiz Tab */}
        <TabsContent value="play">
          <Card>
            <CardContent className="p-6">
              {quizState === 'setup' && (
                <QuizSetup onStartQuiz={handleStartQuiz} />
              )}

              {quizState === 'playing' && quizData && quizConfig && (
                <QuizGame
                  questions={quizData.questions}
                  config={quizConfig}
                  onComplete={handleQuizComplete}
                />
              )}

              {quizState === 'results' && quizConfig && (
                <QuizResults
                  config={quizConfig}
                  onPlayAgain={handlePlayAgain}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <QuizLeaderboard />
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <QuizStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}
