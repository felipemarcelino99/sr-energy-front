import axios from 'axios'
import { supabase } from '@/services/supabase'

// ---- Case conversion utilities ----

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

function deepToCamelCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deepToCamelCase)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        toCamelCase(k),
        deepToCamelCase(v),
      ])
    )
  }
  return value
}

function deepToSnakeCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deepToSnakeCase)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        toSnakeCase(k),
        deepToSnakeCase(v),
      ])
    )
  }
  return value
}

// ---- Axios instance ----

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

// Auth header
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Convert outgoing JSON bodies from camelCase to snake_case
api.interceptors.request.use((config) => {
  if (config.data && !(config.data instanceof FormData)) {
    config.data = deepToSnakeCase(config.data)
  }
  return config
})

// Convert incoming JSON responses from snake_case to camelCase
api.interceptors.response.use((response) => {
  if (response.data) {
    response.data = deepToCamelCase(response.data)
  }
  return response
})

export default api
