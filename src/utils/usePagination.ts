import { useState, useEffect } from 'react'

export function usePagination<T>(items: T[], pageSize: number = 10) {
  const [page, setPage] = useState(1)

  // Reset to page 1 when the items array changes (e.g. filter applied)
  useEffect(() => {
    setPage(1)
  }, [items])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const start = (page - 1) * pageSize
  const paginated = items.slice(start, start + pageSize)

  function goTo(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages))
  }

  return {
    page,
    pageSize,
    totalPages,
    paginated,
    goTo,
    next: () => goTo(page + 1),
    prev: () => goTo(page - 1),
  }
}
