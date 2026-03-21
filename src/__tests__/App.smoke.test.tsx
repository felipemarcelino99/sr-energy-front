import { render } from '@testing-library/react'
import App from '@/App'

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
  },
}))

jest.mock('@/services/auth.service', () => ({
  getSession: jest.fn().mockResolvedValue(null),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

describe('App smoke test', () => {
  it('renders without errors', () => {
    const { container } = render(<App />)
    expect(container).toBeInTheDocument()
  })
})
