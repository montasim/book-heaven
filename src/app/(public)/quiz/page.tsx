'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Brain } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { QuizSetup } from '@/components/quiz/quiz-setup'
import { QuizGame } from '@/components/quiz/quiz-game'
import { QuizResults } from '@/components/quiz/quiz-results'
import { QuizLeaderboard } from '@/components/quiz/quiz-leaderboard'
import { QuizStats } from '@/components/quiz/quiz-stats'

type QuizState = 'setup' | 'playing' | 'results'

interface QuizConfig {
  category: string
  categoryName: string
  difficulty: 'any' | 'easy' | 'medium' | 'hard'
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
  const { user } = useAuth()
  const [quizState, setQuizState] = useState<QuizState>('setup')
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null)
  const [quizData, setQuizData] = useState<QuizData | null>(null)

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
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quiz Game</h1>
              <p className="text-muted-foreground">
                Test your knowledge and climb the leaderboard!
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Play Quiz Card */}
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

          {/* Leaderboard & Stats Column */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <QuizLeaderboard />

            {/* My Stats */}
            {user && <QuizStats />}
          </div>
        </div>
      </main>
    </div>
  )
}
