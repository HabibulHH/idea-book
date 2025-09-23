import { useState } from 'react'

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = (state: boolean) => {
    setIsLoading(state)
  }

  const setLoadingState = (key: string, state: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: state
    }))
  }

  const withLoading = async <T>(operation: () => Promise<T>, key?: string): Promise<T> => {
    if (key) {
      setLoadingState(key, true)
    } else {
      setLoading(true)
    }

    try {
      const result = await operation()
      return result
    } finally {
      if (key) {
        setLoadingState(key, false)
      } else {
        setLoading(false)
      }
    }
  }

  return {
    isLoading,
    loadingStates,
    setLoading,
    setLoadingState,
    withLoading,
    isLoadingKey: (key: string) => loadingStates[key] || false
  }
}