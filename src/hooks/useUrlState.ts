import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Sync a single string value with a URL search param.
 * Falls back to `defaultValue` when the param is absent.
 */
export function useUrlState(key: string, defaultValue = '') {
  const [searchParams, setSearchParams] = useSearchParams()

  const value = searchParams.get(key) ?? defaultValue

  const setValue = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (!next || next === defaultValue) {
            params.delete(key)
          } else {
            params.set(key, next)
          }
          return params
        },
        { replace: true }
      )
    },
    [key, defaultValue, setSearchParams]
  )

  return [value, setValue] as const
}

/**
 * Sync a string array (comma-separated in the URL) with a URL search param.
 * Useful for multi-select filters (e.g. status, client).
 */
export function useUrlArrayState(key: string) {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = searchParams.get(key) ?? ''
  const value = useMemo(() => (raw ? raw.split(',').filter(Boolean) : []), [raw])

  const setValue = useCallback(
    (next: string[]) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (!next || next.length === 0) {
            params.delete(key)
          } else {
            params.set(key, next.join(','))
          }
          return params
        },
        { replace: true }
      )
    },
    [key, setSearchParams]
  )

  return [value, setValue] as const
}
