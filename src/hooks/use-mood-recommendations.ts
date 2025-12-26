import useSWR from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch data')
  }
  return res.json()
}

export function useMoodRecommendations(mood: string | null, limit: number = 12) {
  const shouldFetch = mood ? true : false

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/public/books/by-mood?mood=${mood}&limit=${limit}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  )

  return {
    data: data?.data,
    isLoading,
    error,
    mutate,
  }
}
