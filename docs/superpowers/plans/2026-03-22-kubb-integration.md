# Kubb API Client Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a fully typed API client (`@sr-energy/api-client`) from the Fastify backend's live OpenAPI spec using Kubb, replacing the 10 hand-written Axios service files in the frontend with type-safe React Query hooks.

**Architecture:** Add `@fastify/swagger` to the API to expose a live OpenAPI spec at `/docs/json`. Create a `packages/api-client` npm workspace that uses Kubb to read that spec and generate TypeScript types, Zod schemas, and React Query hooks. The frontend imports from `@sr-energy/api-client` and drops all manual Axios services.

**Tech Stack:** `@fastify/swagger`, `@fastify/swagger-ui`, `kubb`, `@kubb/plugin-ts`, `@kubb/plugin-zod`, `@kubb/plugin-react-query`, `@tanstack/react-query`, `axios`, `axios-mock-adapter` (test only).

> **Prerequisite:** The monorepo from `docs/superpowers/plans/2026-03-21-monorepo-migration.md` must already be set up. All paths below are relative to the monorepo root `sr-energy/`.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/api/src/app.ts` | Modify | Register `@fastify/swagger` + `@fastify/swagger-ui` |
| `apps/api/src/routes/jobs.ts` | Modify | Add Fastify `schema:` objects for OpenAPI |
| `apps/api/src/routes/employees.ts` | Modify | Add Fastify `schema:` objects for OpenAPI |
| `apps/api/src/routes/machines.ts` | Modify | Add Fastify `schema:` objects for OpenAPI |
| `apps/api/src/routes/contracts.ts` | Modify | Add Fastify `schema:` objects for OpenAPI |
| `apps/api/src/routes/transactions.ts` | Modify | Add Fastify `schema:` objects for OpenAPI |
| `apps/api/src/routes/notifications.ts` | Modify | Add Fastify `schema:` objects for OpenAPI |
| `apps/api/src/routes/reports.ts` | Modify | Add Fastify `schema:` objects for OpenAPI |
| `apps/api/src/routes/chat.ts` | Modify | Add Fastify `schema:` objects for OpenAPI |
| `apps/api/tests/swagger.test.ts` | Create | TDD: verify `/docs/json` returns valid OpenAPI 3.0 spec |
| `packages/api-client/package.json` | Create | Workspace package with Kubb devDeps + axios runtime dep |
| `packages/api-client/tsconfig.json` | Create | Extends `../../tsconfig.base.json` |
| `packages/api-client/kubb.config.ts` | Create | Kubb input/output config |
| `packages/api-client/src/http-client.ts` | Create | Axios instance factory with JWT + casing interceptors |
| `packages/api-client/src/index.ts` | Create | Barrel re-export for all generated + handwritten code |
| `packages/api-client/tests/http-client.test.ts` | Create | TDD: JWT attachment, null token, casing conversion |
| `packages/api-client/jest.config.ts` | Create | Jest config for the package |
| `apps/frontend/src/main.tsx` | Modify | Add `QueryClientProvider` wrapper |
| `apps/frontend/src/services/api.ts` | Delete | Replaced by `packages/api-client/src/http-client.ts` |
| `apps/frontend/src/services/*.service.ts` (×9) | Delete | Replaced by generated React Query hooks |
| `apps/frontend/src/__tests__/**` | Modify | Update mocks from Axios services → React Query hooks |

---

## Task 0: Verify Baseline — All Tests Green

- [ ] **Step 1: Run all tests from monorepo root**

```bash
cd sr-energy
npm test
```

Expected: All tests in `apps/frontend` and `apps/api` pass. If any fail, stop and fix before continuing.

---

## Task 1: Add `@fastify/swagger` to the API (TDD)

**Files:**
- Create: `apps/api/tests/swagger.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/swagger.test.ts`:

```ts
import { buildApp } from '../src/app'

describe('OpenAPI spec', () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(() => app.close())

  it('exposes GET /docs/json returning a valid OpenAPI 3.0 document', async () => {
    const res = await app.inject({ method: 'GET', url: '/docs/json' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.openapi).toBe('3.0.0')
    expect(body.info.title).toBe('SR Energy API')
    expect(typeof body.paths).toBe('object')
  })
})
```

> Note: Before writing the test, verify the export name: `grep "^export" apps/api/src/app.ts`. If the function is named `createApp` or similar, use that name in the import above.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:api -- --testPathPattern=swagger
```

Expected: FAIL — `/docs/json` not found (404) or `buildApp` not exported.

- [ ] **Step 3: Install `@fastify/swagger` and `@fastify/swagger-ui`**

```bash
npm install @fastify/swagger @fastify/swagger-ui --workspace=apps/api
```

- [ ] **Step 4: Register swagger in `apps/api/src/app.ts`**

Add the two plugin registrations **before** routes are registered:

```ts
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

// Inside buildApp(), before route registrations:
await app.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'SR Energy API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
})

await app.register(swaggerUi, {
  routePrefix: '/docs',
})
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test:api -- --testPathPattern=swagger
```

Expected: PASS — 1 test passing.

- [ ] **Step 6: Smoke-test Swagger UI in browser**

```bash
npm run dev:api
# Open http://localhost:3000/docs in browser
```

Expected: Swagger UI loads (may show empty paths — routes get schemas in the next tasks).

- [ ] **Step 7: Commit**

```bash
git add apps/api/
git commit -m "feat(api): add @fastify/swagger and expose /docs/json OpenAPI spec"
```

---

## Task 2: Add OpenAPI Schemas to Jobs Routes

**Files:**
- Modify: `apps/api/src/routes/jobs.ts`

Routes currently use manual Zod validation inside handlers. We add a Fastify `schema:` property to each route for documentation/OpenAPI only — existing Zod validation is unchanged.

- [ ] **Step 1: Define shared schema objects at the top of the file**

Add before the route handler definitions in `apps/api/src/routes/jobs.ts`:

```ts
// ── OpenAPI schema definitions ──────────────────────────────────────────────

const JobSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
    employeeId: { type: 'string', format: 'uuid', nullable: true },
    machineId: { type: 'string', format: 'uuid', nullable: true },
    employeeName: { type: 'string', nullable: true },
    machineName: { type: 'string', nullable: true },
    startDate: { type: 'string', format: 'date-time', nullable: true },
    endDate: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const

const JobBodySchema = {
  type: 'object',
  required: ['title'],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string' },
    employeeId: { type: 'string', format: 'uuid' },
    machineId: { type: 'string', format: 'uuid' },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
  },
} as const

const IdParamSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const
```

- [ ] **Step 2: Add `schema:` to each route registration**

For each `fastify.get/post/put/patch` call, add a `schema:` option:

```ts
// GET /jobs
fastify.get('/', {
  schema: {
    tags: ['jobs'],
    summary: 'List all jobs',
    response: { 200: { type: 'array', items: JobSchema } },
  },
  handler: async (request, reply) => { /* unchanged */ },
})

// GET /jobs/:id
fastify.get('/:id', {
  schema: {
    tags: ['jobs'],
    summary: 'Get a job by ID',
    params: IdParamSchema,
    response: { 200: JobSchema },
  },
  handler: async (request, reply) => { /* unchanged */ },
})

// POST /jobs
fastify.post('/', {
  schema: {
    tags: ['jobs'],
    summary: 'Create a job',
    body: JobBodySchema,
    response: { 201: JobSchema },
  },
  handler: async (request, reply) => { /* unchanged */ },
})

// PUT /jobs/:id
fastify.put('/:id', {
  schema: {
    tags: ['jobs'],
    summary: 'Update a job',
    params: IdParamSchema,
    body: JobBodySchema,
    response: { 200: JobSchema },
  },
  handler: async (request, reply) => { /* unchanged */ },
})

// PATCH /jobs/:id/cancel
fastify.patch('/:id/cancel', {
  schema: {
    tags: ['jobs'],
    summary: 'Cancel a job',
    params: IdParamSchema,
    response: { 200: JobSchema },
  },
  handler: async (request, reply) => { /* unchanged */ },
})
```

- [ ] **Step 3: Verify jobs routes appear in the spec**

```bash
npm run dev:api &
curl http://localhost:3000/docs/json | grep -A5 '"\/jobs"'
kill %1
```

Expected: JSON output shows `/jobs` paths with schema definitions.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/jobs.ts
git commit -m "feat(api): add OpenAPI schemas to jobs routes"
```

---

## Task 3: Add OpenAPI Schemas to Remaining Route Files

**Files:**
- Modify: `apps/api/src/routes/employees.ts`
- Modify: `apps/api/src/routes/machines.ts`
- Modify: `apps/api/src/routes/contracts.ts`
- Modify: `apps/api/src/routes/transactions.ts`
- Modify: `apps/api/src/routes/notifications.ts`
- Modify: `apps/api/src/routes/reports.ts`
- Modify: `apps/api/src/routes/chat.ts`

Follow the exact same pattern as Task 2 for each file:
1. **Before writing any schema**, grep the route file to see actual fields returned:
   ```bash
   grep -A 30 "\.select\|\.from\|return\|reply\.send" apps/api/src/routes/employees.ts | head -40
   ```
   This reveals the real column names so you don't guess wrong.
2. Define `*Schema` and `*BodySchema` objects at the top of the file using those exact names
3. Add `schema: { tags, summary, [params], [body], response }` to each route
4. Verify in `/docs/json`

Below are the schema shapes per entity as a starting point — **adjust property names to match what the grep above shows**.

**employees.ts:**
```ts
const EmployeeSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    role: { type: 'string' },
    email: { type: 'string', format: 'email' },
    salary: { type: 'number', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const

const SalaryAdjustmentSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    employeeId: { type: 'string', format: 'uuid' },
    amount: { type: 'number' },
    reason: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const
```

**machines.ts:**
```ts
const MachineSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    model: { type: 'string', nullable: true },
    serialNumber: { type: 'string', nullable: true },
    manualUrl: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const
```

**contracts.ts:**
```ts
const ContractSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    clientName: { type: 'string' },
    value: { type: 'number' },
    startDate: { type: 'string', format: 'date' },
    endDate: { type: 'string', format: 'date' },
    status: { type: 'string' },
    fileUrl: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const
```

**transactions.ts:**
```ts
const TransactionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    description: { type: 'string' },
    amount: { type: 'number' },
    type: { type: 'string', enum: ['income', 'expense'] },
    date: { type: 'string', format: 'date' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const
```

**notifications.ts:**
```ts
const NotificationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    message: { type: 'string' },
    read: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const
```

**reports.ts:**
```ts
const ReportSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    jobId: { type: 'string', format: 'uuid' },
    content: { type: 'string' },
    evidences: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, url: { type: 'string' } } } },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const
```

**chat.ts:**
```ts
const ChatRequestSchema = {
  type: 'object',
  required: ['message'],
  properties: { message: { type: 'string' } },
} as const

const ChatResponseSchema = {
  type: 'object',
  properties: { answer: { type: 'string' } },
} as const
```

- [ ] **Step 1: Add schemas to `employees.ts` → commit**

```bash
git add apps/api/src/routes/employees.ts
git commit -m "feat(api): add OpenAPI schemas to employees routes"
```

- [ ] **Step 2: Add schemas to `machines.ts` → commit**

```bash
git add apps/api/src/routes/machines.ts
git commit -m "feat(api): add OpenAPI schemas to machines routes"
```

- [ ] **Step 3: Add schemas to `contracts.ts` → commit**

```bash
git add apps/api/src/routes/contracts.ts
git commit -m "feat(api): add OpenAPI schemas to contracts routes"
```

- [ ] **Step 4: Add schemas to `transactions.ts` → commit**

```bash
git add apps/api/src/routes/transactions.ts
git commit -m "feat(api): add OpenAPI schemas to transactions routes"
```

- [ ] **Step 5: Add schemas to `notifications.ts` → commit**

```bash
git add apps/api/src/routes/notifications.ts
git commit -m "feat(api): add OpenAPI schemas to notifications routes"
```

- [ ] **Step 6: Add schemas to `reports.ts` → commit**

```bash
git add apps/api/src/routes/reports.ts
git commit -m "feat(api): add OpenAPI schemas to reports routes"
```

- [ ] **Step 7: Add schemas to `chat.ts` → commit**

```bash
git add apps/api/src/routes/chat.ts
git commit -m "feat(api): add OpenAPI schemas to chat route"
```

- [ ] **Step 8: Verify all paths appear in the spec**

```bash
npm run dev:api &
curl -s http://localhost:3000/docs/json | grep '"tags"' | sort | uniq
kill %1
```

Expected: Output lists `jobs`, `employees`, `machines`, `contracts`, `transactions`, `notifications`, `reports`, `chat`.

- [ ] **Step 9: Run API tests to confirm no regressions**

```bash
npm run test:api
```

Expected: All tests pass.

---

## Task 4: Create `packages/api-client` Workspace

**Files:**
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/tsconfig.json`
- Create: `packages/api-client/jest.config.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p packages/api-client/src/generated
mkdir -p packages/api-client/tests
```

- [ ] **Step 2: Write `packages/api-client/package.json`**

```json
{
  "name": "@sr-energy/api-client",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "generate": "kubb --config kubb.config.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "kubb": "^2.0.0",
    "@kubb/plugin-ts": "^2.0.0",
    "@kubb/plugin-zod": "^2.0.0",
    "@kubb/plugin-react-query": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios-mock-adapter": "^2.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "@tanstack/react-query": "^5.0.0"
  }
}
```

> Note: Use the same Kubb major version that is current (check https://kubb.dev for latest v2 package names — they follow `@kubb/plugin-*` naming).

- [ ] **Step 3: Write `packages/api-client/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Write `packages/api-client/jest.config.ts`**

```ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@sr-energy/api-client$': '<rootDir>/src/index.ts',
  },
}

export default config
```

- [ ] **Step 5: Install new workspace dependencies**

```bash
npm install
```

Expected: `packages/api-client` deps installed, hoisted to root where possible.

- [ ] **Step 6: Commit**

```bash
git add packages/api-client/
git commit -m "chore: scaffold @sr-energy/api-client workspace package"
```

---

## Task 5: Build `http-client.ts` (TDD)

**Files:**
- Create: `packages/api-client/tests/http-client.test.ts`
- Create: `packages/api-client/src/http-client.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/api-client/tests/http-client.test.ts`:

```ts
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { createApiClient } from '../src/http-client'

describe('createApiClient', () => {
  it('attaches Authorization header when getToken returns a token', async () => {
    const getToken = jest.fn().mockResolvedValue('test-jwt')
    const client = createApiClient(getToken, 'http://localhost:3000')

    const mock = new MockAdapter(client)
    mock.onGet('/jobs').reply(function (config) {
      return [200, [], config]
    })

    const res = await client.get('/jobs')
    // axios-mock-adapter v2 returns config as the response data in the handler above
    const config = res.data as { headers: Record<string, string> }
    expect(config.headers['Authorization']).toBe('Bearer test-jwt')
    expect(getToken).toHaveBeenCalledTimes(1)
  })

  it('omits Authorization header when getToken returns null', async () => {
    const getToken = jest.fn().mockResolvedValue(null)
    const client = createApiClient(getToken, 'http://localhost:3000')

    const mock = new MockAdapter(client)
    mock.onGet('/jobs').reply(function (config) {
      return [200, [], config]
    })

    const res = await client.get('/jobs')
    const config = res.data as { headers: Record<string, string> }
    expect(config.headers['Authorization']).toBeUndefined()
  })

  it('converts camelCase request body to snake_case', async () => {
    const getToken = jest.fn().mockResolvedValue(null)
    const client = createApiClient(getToken, 'http://localhost:3000')

    const mock = new MockAdapter(client)
    mock.onPost('/jobs').reply(function (config) {
      return [201, JSON.parse(config.data), config]
    })

    const res = await client.post('/jobs', { employeeId: 'abc', startDate: '2026-01-01' })
    expect(res.data).toMatchObject({ employee_id: 'abc', start_date: '2026-01-01' })
  })

  it('converts snake_case response body to camelCase', async () => {
    const getToken = jest.fn().mockResolvedValue(null)
    const client = createApiClient(getToken, 'http://localhost:3000')

    const mock = new MockAdapter(client)
    mock.onGet('/jobs/1').reply(200, { id: '1', employee_id: 'abc', machine_name: 'Drill' })

    const res = await client.get('/jobs/1')
    expect(res.data).toMatchObject({ id: '1', employeeId: 'abc', machineName: 'Drill' })
  })

  it('registers at least 2 request interceptors and 1 response interceptor', () => {
    const getToken = jest.fn().mockResolvedValue(null)
    const client = createApiClient(getToken, 'http://localhost:3000')
    // @ts-expect-error – accessing internal handler list for verification
    expect(client.interceptors.request.handlers.length).toBeGreaterThanOrEqual(2)
    // @ts-expect-error
    expect(client.interceptors.response.handlers.length).toBeGreaterThanOrEqual(1)
  })

  it('does not convert FormData request bodies', async () => {
    const getToken = jest.fn().mockResolvedValue(null)
    const client = createApiClient(getToken, 'http://localhost:3000')

    const mock = new MockAdapter(client)
    mock.onPost('/upload').reply(function (config) {
      return [200, config.data]
    })

    const formData = new FormData()
    formData.append('file', new Blob(['test']))
    const res = await client.post('/upload', formData)
    expect(res.data).toBeInstanceOf(FormData)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test --workspace=packages/api-client
```

Expected: FAIL — `createApiClient` not found.

- [ ] **Step 3: Implement `packages/api-client/src/http-client.ts`**

```ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

type GetToken = () => Promise<string | null>

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function convertKeys(obj: unknown, converter: (key: string) => string): unknown {
  if (Array.isArray(obj)) return obj.map((item) => convertKeys(item, converter))
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        converter(key),
        convertKeys(value, converter),
      ])
    )
  }
  return obj
}

export function createApiClient(getToken: GetToken, baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL })

  // Attach JWT
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  })

  // Convert request body camelCase → snake_case (skip FormData)
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (config.data && !(config.data instanceof FormData)) {
      config.data = convertKeys(config.data, toSnakeCase)
    }
    return config
  })

  // Convert response body snake_case → camelCase
  client.interceptors.response.use((response) => {
    if (response.data) {
      response.data = convertKeys(response.data, toCamelCase)
    }
    return response
  })

  return client
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test --workspace=packages/api-client
```

Expected: All 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/api-client/src/http-client.ts packages/api-client/tests/http-client.test.ts
git commit -m "feat(api-client): add http-client with JWT injection and casing conversion"
```

---

## Task 6: Configure Kubb and Run First Generation

**Files:**
- Create: `packages/api-client/kubb.config.ts`
- Create: `packages/api-client/src/index.ts`

- [ ] **Step 1: Add `API_BASE_URL` to monorepo root `.env`**

Append to `sr-energy/.env` (not committed — already in .gitignore):

```
API_BASE_URL=http://localhost:3000
```

- [ ] **Step 2: Write `packages/api-client/kubb.config.ts`**

```ts
import { defineConfig } from 'kubb'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginReactQuery } from '@kubb/plugin-react-query'

const baseURL = process.env['API_BASE_URL']
if (!baseURL) {
  throw new Error('API_BASE_URL env var is not set. Add it to sr-energy/.env before running generation.')
}

export default defineConfig({
  input: {
    path: `${baseURL}/docs/json`,
  },
  output: {
    path: './src/generated',
    clean: true,
  },
  plugins: [
    pluginTs({
      output: { path: 'types' },
    }),
    pluginZod({
      output: { path: 'zod' },
    }),
    pluginReactQuery({
      output: { path: 'hooks' },
      client: {
        importPath: '../../http-client',
      },
    }),
  ],
})
```

> Note: The `client.importPath` tells Kubb where to import the Axios client from. Adjust if needed after seeing the generated output.

- [ ] **Step 3: Start the API server**

```bash
npm run dev:api &
API_PID=$!
sleep 3
```

- [ ] **Step 4: Run Kubb generation**

```bash
npm run generate --workspace=packages/api-client
```

Expected: `packages/api-client/src/generated/types/`, `zod/`, and `hooks/` directories are created with generated files.

If it fails:
- Verify `/docs/json` is reachable: `curl http://localhost:3000/docs/json`
- Check Kubb version compatibility with plugin API

- [ ] **Step 5: Stop the API server**

```bash
kill $API_PID
```

- [ ] **Step 6: Inspect generated output and note the actual file/folder names**

```bash
ls packages/api-client/src/generated/
ls packages/api-client/src/generated/hooks/   | head -5
ls packages/api-client/src/generated/types/   | head -5
ls packages/api-client/src/generated/zod/     | head -5
```

Note the exact sub-folder and barrel file names Kubb created (they may differ from `types/index.ts` — e.g. Kubb might output `models/` or individual files).

- [ ] **Step 7: Write `packages/api-client/src/index.ts` using the actual paths from Step 6**

```ts
// Generated — do not edit manually
export * from './generated/types'   // adjust if Kubb used a different folder name
export * from './generated/zod'
export * from './generated/hooks'

// Handwritten
export { createApiClient } from './http-client'
```

Replace `types`, `zod`, `hooks` with whatever folder/barrel names Kubb actually produced.

- [ ] **Step 9: Commit generated files and config**

```bash
git add packages/api-client/
git commit -m "feat(api-client): add kubb.config.ts and commit first generation"
```

---

## Task 7: Add React Query to Frontend

**Files:**
- Modify: `apps/frontend/package.json`
- Modify: `apps/frontend/src/main.tsx`

- [ ] **Step 1: Install `@tanstack/react-query` in frontend**

```bash
npm install @tanstack/react-query --workspace=apps/frontend
npm install @sr-energy/api-client --workspace=apps/frontend
```

- [ ] **Step 2: Update `apps/frontend/src/main.tsx`**

Current content wraps `<App />` in `<StrictMode>`. Replace with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,   // 1 minute
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
```

> Before editing: check where `BrowserRouter` lives — run `grep -r "BrowserRouter" apps/frontend/src --include="*.tsx" -l`. If it is in `App.tsx`, the wrapper order above is correct as-is (`QueryClientProvider` wraps `<App />` which internally wraps `BrowserRouter`). If `BrowserRouter` is already in `main.tsx`, keep it inside `QueryClientProvider` so the order is: `StrictMode > QueryClientProvider > BrowserRouter > App`.

- [ ] **Step 3: Run frontend tests to confirm no regressions**

```bash
npm run test:frontend
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/main.tsx apps/frontend/package.json
git commit -m "feat(frontend): add QueryClientProvider and @sr-energy/api-client dependency"
```

---

## Task 8: Migrate Frontend Call Sites to Generated Hooks

**Context:** Each view/viewmodel that currently calls a service function must be updated to use a generated React Query hook. The pattern is:

**Before:**
```ts
// In a viewmodel or component
import { fetchJobs } from '../services/job.service'
const jobs = await fetchJobs()
```

**After:**
```ts
import { useGetJobs } from '@sr-energy/api-client'
const { data: jobs, isLoading, error } = useGetJobs()
```

Run the frontend tests after each file migrated to catch regressions immediately.

- [ ] **Step 1: Discover all call sites**

```bash
grep -r "from.*services/" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Read this list — it tells you every file to update. Keep it open as your checklist.

- [ ] **Step 2: Look up generated hook names for jobs**

```bash
ls packages/api-client/src/generated/hooks/ | grep -i job
```

Note the exact hook names (e.g. `useGetJobs`, `useGetJobsId`, `usePostJobs`, `usePutJobsId`, `usePatchJobsIdCancel`).

- [ ] **Step 3: Find files importing `job.service.ts`**

```bash
grep -r "from.*job.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 4: Update each file from Step 3**

For each file: remove the `job.service` import, add the correct hook imports from `@sr-energy/api-client`, and update the call site logic:

```ts
// Before
import { fetchJobs } from '../services/job.service'
const jobs = await fetchJobs()

// After
import { useGetJobs } from '@sr-energy/api-client'
const { data: jobs, isLoading, error } = useGetJobs()
```

For mutations (`createJob`, `updateJob`, `cancelJob`) use the mutation hook:
```ts
import { usePostJobs } from '@sr-energy/api-client'
const { mutate: createJob, isPending } = usePostJobs()
createJob({ title: '...', employeeId: '...' })
```

- [ ] **Step 5: Run tests after job migration**

```bash
npm run test:frontend
```

Expected: All tests pass. Fix any failures before continuing.

- [ ] **Step 6: Find and update files importing `employee.service.ts`**

```bash
grep -r "from.*employee.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Look up hook names: `ls packages/api-client/src/generated/hooks/ | grep -i employee`

Apply the same Before/After pattern. Run tests: `npm run test:frontend`

- [ ] **Step 7: Find and update files importing `machine.service.ts`**

```bash
grep -r "from.*machine.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Look up hook names: `ls packages/api-client/src/generated/hooks/ | grep -i machine`

Apply the pattern. Run tests: `npm run test:frontend`

- [ ] **Step 8: Find and update files importing `contract.service.ts`**

```bash
grep -r "from.*contract.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Look up hook names: `ls packages/api-client/src/generated/hooks/ | grep -i contract`

Apply the pattern. Run tests: `npm run test:frontend`

- [ ] **Step 9: Find and update files importing `transaction.service.ts`**

```bash
grep -r "from.*transaction.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Apply the pattern. Run tests: `npm run test:frontend`

- [ ] **Step 10: Find and update files importing `notification.service.ts`**

```bash
grep -r "from.*notification.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Apply the pattern. Run tests: `npm run test:frontend`

- [ ] **Step 11: Find and update files importing `dashboard.service.ts`**

```bash
grep -r "from.*dashboard.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Apply the pattern. Run tests: `npm run test:frontend`

- [ ] **Step 12: Find and update files importing `job-report.service.ts`**

```bash
grep -r "from.*job-report.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Apply the pattern. Run tests: `npm run test:frontend`

- [ ] **Step 13: Find and update files importing `chat.service.ts`**

```bash
grep -r "from.*chat.service" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

For chat (POST + streaming response), the hook will be a mutation:
```ts
import { usePostChat } from '@sr-energy/api-client'
const { mutate: sendMessage, data: response } = usePostChat()
sendMessage({ message: 'How many jobs are pending?' })
```

Run tests: `npm run test:frontend`

- [ ] **Step 14: Find and update files importing `api.ts` directly**

```bash
grep -r "from.*services/api" apps/frontend/src --include="*.ts" --include="*.tsx" -l
```

Any direct imports of the Axios instance should be removed; the generated hooks use `http-client.ts` internally.

- [ ] **Step 15: Commit all migrated call sites**

```bash
git add apps/frontend/src/
git commit -m "feat(frontend): migrate all call sites to @sr-energy/api-client hooks"
```

---

## Task 9: Update Frontend Tests to Mock React Query Hooks

**Context:** Tests that previously mocked Axios service functions now need to mock React Query hooks. The pattern changes from:

**Before:**
```ts
jest.mock('../services/job.service', () => ({
  fetchJobs: jest.fn().mockResolvedValue([{ id: '1', title: 'Job A' }]),
}))
```

**After:**
```ts
jest.mock('@sr-energy/api-client', () => ({
  useGetJobs: jest.fn().mockReturnValue({
    data: [{ id: '1', title: 'Job A' }],
    isLoading: false,
    error: null,
  }),
}))
```

- [ ] **Step 1: Find all test files that mock the old service modules**

```bash
grep -r "jest.mock.*service" apps/frontend/src/__tests__ --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: Update job-related test mocks**

In every test file that mocks `job.service`, replace:
```ts
jest.mock('../services/job.service', () => ({
  fetchJobs: jest.fn().mockResolvedValue([...]),
}))
```
With:
```ts
jest.mock('@sr-energy/api-client', () => ({
  useGetJobs: jest.fn().mockReturnValue({ data: [...], isLoading: false, error: null }),
  usePostJobs: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false }),
  usePutJobsId: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false }),
  usePatchJobsIdCancel: jest.fn().mockReturnValue({ mutate: jest.fn(), isPending: false }),
}))
```

Run: `npm run test:frontend` — fix failures before continuing.

- [ ] **Step 3: Update employee-related test mocks**

Same pattern — replace `jest.mock('../services/employee.service', ...)` with `jest.mock('@sr-energy/api-client', ...)` using the correct hook names from `packages/api-client/src/generated/hooks/`.

Run: `npm run test:frontend`

- [ ] **Step 4: Update machine-related test mocks**

Same pattern. Run: `npm run test:frontend`

- [ ] **Step 5: Update contract-related test mocks**

Same pattern. Run: `npm run test:frontend`

- [ ] **Step 6: Update transaction-related test mocks**

Same pattern. Run: `npm run test:frontend`

- [ ] **Step 7: Update notification-related test mocks**

Same pattern. Run: `npm run test:frontend`

- [ ] **Step 8: Update dashboard / job-report / chat test mocks**

Same pattern for remaining files. Run: `npm run test:frontend`

> If a test fails with "hook name not found", check the actual generated hook name:
> ```bash
> ls packages/api-client/src/generated/hooks/
> ```
> and update the mock key accordingly.

- [ ] **Step 9: Verify full test suite is green**

```bash
npm run test:frontend
```

Expected: All tests pass, same count as Task 0 baseline.

- [ ] **Step 10: Commit updated tests**

```bash
git add apps/frontend/src/__tests__/
git commit -m "test(frontend): update mocks from Axios services to React Query hooks"
```

---

## Task 10: Delete the 10 Old Service Files

Only do this after Task 8 and Task 9 are complete and all tests are green.

- [ ] **Step 1: Verify no imports remain for the old services**

```bash
grep -r "from.*services/api" apps/frontend/src --include="*.ts" --include="*.tsx"
grep -r "from.*\.service" apps/frontend/src --include="*.ts" --include="*.tsx" | grep -v "supabase\|auth"
```

Expected: No output. If any files still import old services, fix them before continuing.

- [ ] **Step 2: Delete the 10 service files**

```bash
rm apps/frontend/src/services/api.ts
rm apps/frontend/src/services/chat.service.ts
rm apps/frontend/src/services/job.service.ts
rm apps/frontend/src/services/contract.service.ts
rm apps/frontend/src/services/employee.service.ts
rm apps/frontend/src/services/machine.service.ts
rm apps/frontend/src/services/dashboard.service.ts
rm apps/frontend/src/services/job-report.service.ts
rm apps/frontend/src/services/transaction.service.ts
rm apps/frontend/src/services/notification.service.ts
```

- [ ] **Step 3: Run all tests one final time**

```bash
npm test
```

Expected: All tests across both apps pass.

- [ ] **Step 4: Run full build**

```bash
npm run build
```

Expected: Both apps build successfully.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: replace hand-written Axios services with generated @sr-energy/api-client hooks"
git tag v0.2.0-kubb
```

---

## Re-generation Workflow (for future API changes)

When a backend route or schema changes:

```bash
# 1. Make your route + schema change in apps/api
# 2. Start the API server
npm run dev:api &

# 3. Regenerate the client
npm run generate --workspace=packages/api-client

# 4. Review the diff in src/generated/
git diff packages/api-client/src/generated/

# 5. Update any frontend call sites if hook signatures changed
# 6. Run tests
npm test

# 7. Commit generated files alongside the API change
git add apps/api/ packages/api-client/src/generated/
git commit -m "feat(api): <describe change> + regenerate api-client"
```

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Kubb-generated hook names differ from expected (e.g. `useJobsList` vs `useGetJobs`) | Check `src/generated/hooks/` after first generation and update Task 8/9 mock names |
| Kubb v2 plugin API breaking changes | Pin exact Kubb versions in `package.json`; check kubb.dev/changelog |
| `@kubb/plugin-react-query` generates hooks expecting a different Axios client signature | Read generated hook source and adjust `kubb.config.ts` `client.importPath` |
| FormData file-upload routes may not generate well-typed hooks | Test file-upload flows manually after migration; may need custom wrappers |
| `axios-mock-adapter` v2 API differences | Verify the mock adapter version matches the test code patterns above |
