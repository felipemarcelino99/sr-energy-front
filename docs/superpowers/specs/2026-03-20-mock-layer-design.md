# Mock Layer Design — SR Energy Front

**Date:** 2026-03-20
**Status:** Approved
**Author:** Claude Code

---

## Context

The frontend application calls a REST API at `http://localhost:3000` for all data operations (employees, jobs, machines, contracts, transactions, reports, notifications, chat). That backend does not exist yet.

Authentication uses Supabase Auth directly via the `supabase-js` SDK — not through the REST API.

The goal is to make the app fully navigable and usable for development and demonstration purposes, without a real backend, and with zero friction to revert once the real backend exists.

---

## Decision

Use **MSW (Mock Service Worker)** to intercept all REST API calls in the browser and return seeded, realistic fake data. Auth is handled by a **mock implementation behind an env flag** that bypasses Supabase.

This approach was chosen because:

- All Axios-based service files remain **completely unchanged** — MSW intercepts at the network layer, not the code layer. The only exception is `auth.service.ts`, which uses the Supabase SDK (not Axios) and receives a minimal env-flag toggle
- The mock is activated by a single env variable (`VITE_MOCK=true`) — toggling it off restores real API behavior instantly
- Auth mock is isolated to `auth.service.ts` only and clearly marked as temporary

---

## Setup Steps (one-time)

```bash
npm install msw --save-dev
npx msw init public/ --save
```

The second command creates `public/mockServiceWorker.js`, which MSW requires to register as a browser Service Worker. Without it, `worker.start()` fails silently.

---

## Architecture

```
Browser
  └── React App
        ├── services/employee.service.ts   ← UNCHANGED
        ├── services/job.service.ts        ← UNCHANGED
        ├── services/machine.service.ts    ← UNCHANGED
        ├── services/contract.service.ts   ← UNCHANGED
        ├── services/transaction.service.ts← UNCHANGED
        ├── services/job-report.service.ts ← UNCHANGED
        ├── services/notification.service.ts ← UNCHANGED
        ├── services/chat.service.ts       ← UNCHANGED
        ├── services/dashboard.service.ts  ← UNCHANGED (calls /transactions, /jobs,
        │                                    /contracts/expiring — covered by existing handlers)
        └── services/auth.service.ts       ← env toggle: mock | real Supabase
```

MSW intercepts at the network layer. No service file, viewmodel, or component is aware of the mock.

### MSW activation (`src/main.tsx`)

```ts
async function prepare() {
  if (import.meta.env.VITE_MOCK === 'true') {
    const { worker } = await import('@/mocks/browser')
    return worker.start({ onUnhandledRequest: 'warn' })
    // 'warn' logs console warnings for any uncovered route,
    // making gaps visible during development.
  }
}
prepare().then(() => ReactDOM.createRoot(...).render(...))
```

### Auth toggle (`src/services/auth.service.ts`)

`auth.service.ts` is the **one exception** — it uses the Supabase SDK rather than Axios, so MSW cannot intercept it. The file gets a minimal env-flag branch: when `VITE_MOCK=true`, `signIn`/`signOut`/`getSession` resolve against a hardcoded credential table with session stored in `localStorage`. When `VITE_MOCK=false` (or unset), they delegate to Supabase Auth unchanged.

---

## Route Manifest

Complete list of all routes the service files call, mapped to their MSW handler files:

| Handler file | Method | Route | Response type | Notes |
|---|---|---|---|---|
| `employees.ts` | GET | `/employees` | `Employee[]` | |
| `employees.ts` | GET | `/employees/:id` | `Employee` | |
| `employees.ts` | POST | `/employees` | `Employee` | |
| `employees.ts` | PUT | `/employees/:id` | `Employee` | |
| `employees.ts` | DELETE | `/employees/:id` | `204` | |
| `salary-adjustments.ts` | GET | `/employees/:id/salary-adjustments` | `SalaryAdjustment[]` | |
| `salary-adjustments.ts` | POST | `/employees/:id/salary-adjustments` | `SalaryAdjustment` | |
| `jobs.ts` | GET | `/jobs` | `Job[]` | also used by dashboard.service |
| `jobs.ts` | GET | `/jobs/:id` | `Job` | |
| `jobs.ts` | POST | `/jobs` | `Job` | |
| `jobs.ts` | PUT | `/jobs/:id` | `Job` | |
| `jobs.ts` | PATCH | `/jobs/:id/cancel` | `Job` | |
| `job-reports.ts` | GET | `/jobs/:jobId/report` | `JobReport` | |
| `job-reports.ts` | POST | `/jobs/:jobId/report` | `JobReport` | |
| `job-reports.ts` | POST | `/reports/:reportId/evidences` | `{ url: string }` | ⚠️ file upload |
| `machines.ts` | GET | `/machines` | `Machine[]` | |
| `machines.ts` | GET | `/machines/:id` | `Machine` | |
| `machines.ts` | POST | `/machines` | `Machine` | |
| `machines.ts` | PUT | `/machines/:id` | `Machine` | |
| `machines.ts` | DELETE | `/machines/:id` | `204` | |
| `machines.ts` | POST | `/machines/:id/manual` | `{ url: string }` | ⚠️ file upload |
| `contracts.ts` | GET | `/contracts` | `Contract[]` | |
| `contracts.ts` | GET | `/contracts/:id` | `Contract` | |
| `contracts.ts` | GET | `/contracts/expiring` | `ExpiringContract[]` | also used by dashboard.service |
| `contracts.ts` | POST | `/contracts` | `Contract` | |
| `contracts.ts` | PUT | `/contracts/:id` | `Contract` | |
| `contracts.ts` | DELETE | `/contracts/:id` | `204` | |
| `contracts.ts` | POST | `/contracts/:id/file` | `{ url: string }` | ⚠️ file upload |
| `transactions.ts` | GET | `/transactions` | `Transaction[]` | also used by dashboard.service |
| `transactions.ts` | POST | `/transactions` | `Transaction` | |
| `transactions.ts` | DELETE | `/transactions/:id` | `204` | |
| `notifications.ts` | GET | `/notifications` | `Notification[]` | |
| `notifications.ts` | PATCH | `/notifications/:id/read` | `Notification` | |
| `notifications.ts` | PATCH | `/notifications/read-all` | `204` | |
| `chat.ts` | POST | `/chat` | `{ answer: string }` | |

### File upload routes

Three routes receive `multipart/form-data` bodies (marked ⚠️ above):
- `POST /machines/:id/manual`
- `POST /contracts/:id/file`
- `POST /reports/:reportId/evidences`

Mock handlers for these **must not attempt to parse FormData**. They should immediately return a static fake URL:
```json
{ "url": "https://mock.cdn/fake-file.pdf" }
```

---

## Seed Accounts (mock mode only)

| Email | Password | Role |
|-------|----------|------|
| admin@sr.com | 123456 | admin |
| manager@sr.com | 123456 | manager |
| employee@sr.com | 123456 | employee |

---

## Seed Data

Each handler returns a static in-memory array. Mutations (POST, PUT, PATCH, DELETE) update the in-memory array during the session — data resets on page reload, which is acceptable for this phase.

Entities seeded:
- **Employees** — 6 records (mix of employee/manager roles)
- **Jobs** — 10 records (various statuses: scheduled, in_progress, completed, cancelled)
- **Machines** — 5 records
- **Contracts** — 5 records (mix of active/expiring/expired; `expiring` subset used for `/contracts/expiring`)
- **Transactions** — 15 records (credits and debits over 3 months)
- **Job Reports** — 3 records linked to completed jobs
- **Salary Adjustments** — 3 records linked to employees
- **Notifications** — 5 records (mix of read/unread)
- **Chat** — no initial history (POST only; returns a static assistant reply)

---

## File Structure

```
src/
└── mocks/
    ├── browser.ts          # MSW worker setup
    ├── handlers/
    │   ├── index.ts        # exports all handlers combined
    │   ├── employees.ts
    │   ├── jobs.ts
    │   ├── machines.ts
    │   ├── contracts.ts
    │   ├── transactions.ts
    │   ├── job-reports.ts
    │   ├── salary-adjustments.ts
    │   ├── notifications.ts
    │   └── chat.ts
    └── data/
        ├── employees.ts
        ├── jobs.ts
        ├── machines.ts
        ├── contracts.ts
        ├── transactions.ts
        ├── job-reports.ts
        ├── salary-adjustments.ts
        └── notifications.ts
```

---

## Reversion Checklist

To switch from mock to real REST API:

1. Set `VITE_MOCK=false` in `.env` (or remove the variable entirely — also remove from `.env.example` and any CI config)
2. Set `VITE_API_BASE_URL` to the real backend URL
3. Revert `src/services/auth.service.ts` to the original Supabase-only implementation (remove the mock branch)
4. Optionally delete `public/mockServiceWorker.js` and `src/mocks/`
5. Done — no other service files, viewmodels, or components need to change

---

## Out of Scope

- Supabase schema or real database tables (deferred to backend phase)
- MSW in tests (tests use their own mocks already)
- Edge case validation in mock handlers (happy path only)
