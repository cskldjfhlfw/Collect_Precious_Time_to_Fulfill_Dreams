import { useState, useEffect } from 'react'

// 通用 API Hook
export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await apiCall()
        
        if (isMounted) {
          setData(result)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred')
          console.error('API call failed:', err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, dependencies)

  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

// 分页 API Hook
export function usePaginatedApi<T>(
  apiCall: (params: any) => Promise<{ items: T[]; total: number; page: number; size: number; pages: number }>,
  initialParams: any = {}
) {
  const [params, setParams] = useState({ page: 1, size: 10, ...initialParams })
  const [data, setData] = useState<T[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    size: 10,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await apiCall(params)
        
        if (isMounted) {
          setData(result.items)
          setPagination({
            total: result.total,
            page: result.page,
            size: result.size,
            pages: result.pages
          })
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred')
          console.error('Paginated API call failed:', err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [JSON.stringify(params)])

  const updateParams = (newParams: Partial<typeof params>) => {
    setParams((prev: typeof params) => ({ ...prev, ...newParams }))
  }

  const goToPage = (page: number) => {
    updateParams({ page })
  }

  const changePageSize = (size: number) => {
    updateParams({ page: 1, size })
  }

  const search = (searchTerm: string) => {
    updateParams({ page: 1, search: searchTerm })
  }

  const filter = (filters: Record<string, any>) => {
    updateParams({ page: 1, ...filters })
  }

  const refetch = () => {
    setParams((prev: typeof params) => ({ ...prev }))
  }

  return {
    data,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    changePageSize,
    search,
    filter,
    refetch
  }
}
