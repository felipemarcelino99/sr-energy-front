// Isolated in its own module so files that need `import.meta.env` (Vite-only
// syntax) can be jest.mock()'d wholesale by tests that need to exercise the
// *real* implementation of a module without hitting the `import.meta` parse
// error under ts-jest/CommonJS.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL
