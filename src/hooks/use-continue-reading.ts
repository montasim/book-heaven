import useSWR from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch data')
  }
  return res.json()
}

export function useContinueReading(limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/user/continue-reading?limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  return {
    data,
    isLoading,
    error,
    mutate,
  }
}
