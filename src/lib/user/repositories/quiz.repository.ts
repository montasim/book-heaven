/**
 * Quiz Repository
 *
 * Following Repository Pattern and Single Responsibility Principle:
 * This module handles all database operations for QuizAttempt and QuizStreak models
 */

import { prisma } from '@/lib/prisma'

// ============================================================================
// QUIZ SCORING
// ============================================================================

/**
 * Combined Score Formula
 * combinedScore = (correctAnswers * 10) + (quizStreak * 50) + (accuracy * 20)
 */
export function calculateCombinedScore(
  correctAnswers: number,
  quizStreak: number,
  accuracy: number
): number {
  return Math.floor(
    (correctAnswers * 10) +
    (quizStreak * 50) +
    (accuracy * 20)
  )
}

// ============================================================================
// QUIZ STREAK OPERATIONS
// ============================================================================

/**
 * Get or create user streak record
 */
export async function getOrCreateUserStreak(userId: string) {
  return prisma.quizStreak.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })
}

// ============================================================================
// QUIZ ATTEMPT OPERATIONS
// ============================================================================

/**
 * Save quiz attempt and update streaks
 *
 * This function:
 * 1. Creates a new quiz attempt record
 * 2. Updates the user's streak record with:
 *    - Daily streak (consecutive days with wins)
 *    - Best quiz streak (max consecutive correct answers)
 *    - Total statistics
 */
export async function createQuizAttempt(data: {
  userId: string
  category: string
  difficulty: string
  questionCount: number
  score: number
  totalQuestions: number
  quizStreak: number
  timeTaken?: number
}) {
  const accuracy = (data.score / data.totalQuestions) * 100
  const combinedScore = calculateCombinedScore(
    data.score,
    data.quizStreak,
    accuracy
  )

  return prisma.$transaction(async (tx) => {
    // Get current streak to capture dailyStreakAtTime
    const streak = await tx.quizStreak.upsert({
      where: { userId: data.userId },
      create: { userId: data.userId },
      update: {},
    })

    // Create attempt
    const attempt = await tx.quizAttempt.create({
      data: {
        userId: data.userId,
        category: data.category,
        difficulty: data.difficulty,
        questionCount: data.questionCount,
        score: data.score,
        totalQuestions: data.totalQuestions,
        accuracy,
        quizStreak: data.quizStreak,
        dailyStreakAtTime: streak.currentDailyStreak,
        timeTaken: data.timeTaken,
        combinedScore,
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastQuizDate = streak.lastQuizDate
      ? new Date(streak.lastQuizDate)
      : null
    lastQuizDate?.setHours(0, 0, 0, 0)

    // Update daily streak
    let newDailyStreak = streak.currentDailyStreak
    if (data.score >= data.totalQuestions * 0.5) {
      // Win condition: 50% or more correct
      const dayDiff = lastQuizDate
        ? Math.floor((today.getTime() - lastQuizDate.getTime()) / (1000 * 60 * 60 * 24))
        : 1

      if (dayDiff === 0) {
        // Same day - no change
      } else if (dayDiff === 1) {
        // Consecutive day
        newDailyStreak = streak.currentDailyStreak + 1
      } else {
        // Streak broken
        newDailyStreak = 1
      }
    }

    // Update best quiz streak
    const newBestQuizStreak = Math.max(streak.bestQuizStreak, data.quizStreak)

    // Update totals
    await tx.quizStreak.update({
      where: { userId: data.userId },
      data: {
        currentDailyStreak: newDailyStreak,
        bestDailyStreak: Math.max(streak.bestDailyStreak, newDailyStreak),
        bestQuizStreak: newBestQuizStreak,
        lastQuizDate: today,
        totalQuizzes: streak.totalQuizzes + 1,
        totalWins: streak.totalWins + (data.score >= data.totalQuestions * 0.5 ? 1 : 0),
        totalCorrect: streak.totalCorrect + data.score,
        totalQuestions: streak.totalQuestions + data.totalQuestions,
      },
    })

    return attempt
  })
}

/**
 * Get user statistics
 */
export async function getUserQuizStats(userId: string) {
  const streak = await getOrCreateUserStreak(userId)
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { combinedScore: 'desc' },
    take: 10,
  })

  const bestScore = attempts[0]?.combinedScore || 0
  const avgAccuracy = streak.totalQuestions > 0
    ? (streak.totalCorrect / streak.totalQuestions) * 100
    : 0

  return {
    ...streak,
    bestScore,
    avgAccuracy,
    recentAttempts: attempts,
  }
}

/**
 * Get leaderboard
 */
export async function getQuizLeaderboard(limit: number = 50) {
  const attempts = await prisma.quizAttempt.findMany({
    take: limit,
    orderBy: { combinedScore: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  })

  return attempts.map((attempt, index) => ({
    rank: index + 1,
    ...attempt,
  }))
}

/**
 * Get user's best attempts
 */
export async function getUserBestAttempts(userId: string, limit: number = 5) {
  return prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { combinedScore: 'desc' },
    take: limit,
  })
}
