# Kubb API Client Integration — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Goal

Generate a fully typed API client (`@sr-energy/api-client`) from the Fastify backend's OpenAPI spec using Kubb. The generated package produces TypeScript types, Zod schemas, and React Query hooks — replacing the 10 hand-written Axios service files in the frontend.

---

## Architecture

```
apps/api
  └── @fastify/swagger  →  GET /docs/json  (live OpenAPI spec)

packages/api-client
  └── kubb.config.ts    reads /docs/json
  └── src/generated/
        ├── types/      TypeScript interfaces  (@kubb/plugin-ts)
        ├── zod/        Zod schemas            (@kubb/plugin-zod)
        └── hooks/      React Query hooks      (@kubb/plugin-react-query)
  └── src/http-client.ts  Axios instance with Supabase JWT injection
  └── index.ts          barrel re-export

apps/frontend
  └── QueryClientProvider added to main.tsx
  └── Imports @sr-energy/api-client
  └── 10 REST service files deleted
  └── supabase.ts + auth.service.ts kept unchanged
```

---

## New Dependencies

**`apps/api/package.json` (runtime):**

| Package | Purpose |
|---------|---------|
| `@fastify/swagger` | Auto-generate OpenAPI spec from route schemas |
| `@fastify/swagger-ui` | Serve Swagger UI at `/docs` |

**`packages/api-client/package.json`:**

| Package | Type | Purpose |
|---------|------|---------|
| `kubb` | dev | Code generation CLI |
| `@kubb/plugin-ts` | dev | Generate TypeScript types |
| `@kubb/plugin-zod` | dev | Generate Zod schemas |
| `@kubb/plugin-react-query` | dev | Generate React Query hooks |
| `@tanstack/react-query` | dev | Peer dep — hooks compile against it |
| `axios` | runtime | HTTP client used by generated hooks |

**`apps/frontend/package.json`:**

| Package | Type | Purpose |
|---------|------|---------|
| `@tanstack/react-query` | runtime | `QueryClientProvider` + hook execution |
| `@sr-energy/api-client` | runtime | Generated hooks, types, Zod schemas |

---

## Data Flow

1. Developer changes a backend route/schema in `apps/api`
2. Runs `npm run generate --workspace=packages/api-client` from monorepo root
3. Kubb fetches `/docs/json`, regenerates `src/generated/`
4. Generated files are committed — frontend build never needs the API running
5. Frontend imports hooks: `import { useGetJobs } from '@sr-energy/api-client'`

---

## `packages/api-client` Structure

```
packages/api-client/
├── package.json          name: "@sr-energy/api-client"
├── kubb.config.ts        input: http://localhost:3000/docs/json
│                         output: src/generated/
├── src/
│   ├── generated/        ← never edited by hand, committed to git
│   │   ├── types/
│   │   ├── zod/
│   │   └── hooks/
│   ├── http-client.ts    Axios instance + Supabase JWT interceptor
│   └── index.ts          barrel export
└── tsconfig.json         extends ../../tsconfig.base.json
```

---

## Auth Handling

The current `api.ts` interceptor reads the Supabase session JWT and attaches it to every Axios request. When `api.ts` is deleted, this logic moves to `packages/api-client/src/http-client.ts`, which imports the Supabase client directly:

```ts
// packages/api-client/src/http-client.ts
import { supabase } from 'apps/frontend/src/services/supabase'  // resolved via workspace alias
// OR: accept a getToken callback so the package stays framework-agnostic:
export function createApiClient(getToken: () => Promise<string | null>) { ... }
```

**Chosen approach — callback injection:** `http-client.ts` exports `createApiClient(getToken)`. The frontend passes `() => supabase.auth.getSession().then(s => s.data.session?.access_token ?? null)`. This keeps `packages/api-client` independent of Supabase.

`http-client.ts` responsibilities:
- Accept a `getToken` async callback
- Create Axios instance with `baseURL` from `process.env.API_BASE_URL` (set at generation time via monorepo root `.env`)
- Attach `Authorization: Bearer <token>` on each request via request interceptor
- Convert request/response casing (camelCase ↔ snake_case) — same logic as current interceptor

**Kubb config URL:** `kubb.config.ts` reads the backend URL from `process.env.API_BASE_URL` (Node.js env at generation time, not Vite). The monorepo root `.env` defines `API_BASE_URL=http://localhost:3000` for local generation.

---

## Frontend Changes

**Deleted (10 files):**
- `apps/frontend/src/services/api.ts`
- `apps/frontend/src/services/chat.service.ts`
- `apps/frontend/src/services/job.service.ts`
- `apps/frontend/src/services/contract.service.ts`
- `apps/frontend/src/services/employee.service.ts`
- `apps/frontend/src/services/machine.service.ts`
- `apps/frontend/src/services/dashboard.service.ts`
- `apps/frontend/src/services/job-report.service.ts`
- `apps/frontend/src/services/transaction.service.ts`
- `apps/frontend/src/services/notification.service.ts`

**Added:**
- `QueryClientProvider` in `apps/frontend/src/main.tsx`
- Imports from `@sr-energy/api-client` at each call site

**Kept unchanged:**
- `apps/frontend/src/services/supabase.ts`
- `apps/frontend/src/services/auth.service.ts`

---

## Backend Changes

**Added to `apps/api/src/app.ts`:**
- Register `@fastify/swagger` with OpenAPI 3.0 config
- Register `@fastify/swagger-ui` at `/docs`
- Each route file gets JSON Schema `schema:` objects (request body, params, response) so Kubb has full type info

---

## Generation Workflow

```bash
# From monorepo root — requires API running locally
npm run generate --workspace=packages/api-client

# Root package.json convenience script:
"generate": "npm run generate --workspace=packages/api-client"
```

Add to `packages/api-client/package.json`:
```json
"scripts": {
  "generate": "kubb --config kubb.config.ts",
  "build": "tsc"
}
```

---

## Testing Strategy

**Backend (`apps/api`):**
- Test that `GET /docs/json` returns 200 with a valid OpenAPI 3.0 object (`response.openapi === '3.0.0'`).
- Test is written before `@fastify/swagger` is registered (TDD).

**`packages/api-client/src/http-client.ts`** (security-critical — must be tested first):
```ts
it('attaches Authorization header from getToken callback', async () => {
  const getToken = jest.fn().mockResolvedValue('test-jwt')
  const client = createApiClient(getToken)
  // intercept with axios-mock-adapter, verify header
  expect(request.headers['Authorization']).toBe('Bearer test-jwt')
})
it('omits Authorization header when getToken returns null', async () => { ... })
it('converts snake_case response to camelCase', async () => { ... })
```

**Frontend (`apps/frontend`):**
- Existing view/viewmodel tests updated to mock React Query hooks (e.g. `jest.mock('@sr-energy/api-client')`) instead of Axios service functions.
- All existing tests must remain green after migration — no test deletions allowed, only mock target updates.

**`apps/frontend/src/main.tsx` — QueryClientProvider:**
```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60, retry: 1 } },
})

// Wrap order: StrictMode > QueryClientProvider > BrowserRouter > App
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
```

---

## Out of Scope

- OpenAPI spec versioning / changelog automation
- Mock Service Worker (MSW) for test mocking (future improvement)
- Generating SDK for external consumers
