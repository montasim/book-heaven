'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function SeedMoodsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/seed-moods', { method: 'POST' })
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to seed moods',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Seed Initial Moods</CardTitle>
            <CardDescription>
              This will add 8 default moods to your database (Happy, Adventurous, Romantic, Mysterious, Inspired, Nostalgic, Relaxed, Curious)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleSeed} disabled={loading} size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Seed Moods
            </Button>

            {result && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  result.success ? 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100' : 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{result.success ? 'Success!' : 'Error'}</p>
                  <p className="text-sm opacity-90">{result.message}</p>
                  {result.data?.results && (
                    <div className="mt-3 text-sm">
                      <p className="font-medium">Seeded moods:</p>
                      <ul className="mt-1 space-y-1">
                        {result.data.results.map((r: any, i: number) => (
                          <li key={i}>
                            {r.emoji} {r.mood} ({r.categories} categories)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          After seeding, you can edit moods at{' '}
          <a href="/dashboard/moods" className="text-primary hover:underline">
            /dashboard/moods
          </a>
        </div>
      </div>
    </div>
  )
}
