import './commands'

// Suppress uncaught exceptions from third-party libs (e.g. Supabase realtime ws errors in test env)
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('ResizeObserver') ||
    err.message.includes('WebSocket') ||
    err.message.includes('Network Error')
  ) {
    return false
  }
})
