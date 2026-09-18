# SR Energy API — Frontend Integration Documentation

> **Base URL:** `http://localhost:3333` (development)
> **Content-Type:** `application/json` (unless noted as multipart)
> **Authentication:** Bearer Token (Supabase JWT)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Common Patterns](#2-common-patterns)
3. [Employees](#3-employees)
4. [Machines](#4-machines)
5. [Contracts](#5-contracts)
   5A. [Proposals (PC)](#5a-proposals-pc)
6. [Jobs](#6-jobs)
7. [Reports & Evidences](#7-reports--evidences)
8. [Transactions](#8-transactions)
9. [Notifications](#9-notifications)
10. [Chat (RAG)](#10-chat-rag)
11. [Error Reference](#11-error-reference)

---

## 1. Authentication

All endpoints (except `GET /health`) require a **Bearer Token** in the `Authorization` header.

```
Authorization: Bearer <supabase_jwt_token>
```

The token is obtained via **Supabase Auth** (email/password, magic link, etc.) from the frontend client.

### User Roles

| Role       | Description                      |
| ---------- | -------------------------------- |
| `admin`    | Full access                      |
| `manager`  | Can create employees, jobs, etc. |
| `employee` | Restricted to own data           |

### Authenticated User Object

Every authenticated request has access to the following user context (resolved server-side from the token):

```ts
{
  id: string // Supabase Auth user ID
  email: string
  role: 'admin' | 'manager' | 'employee'
  name: string
}
```

### Unauthorized Responses

```json
// Missing or invalid token
401 { "error": "No Authorization was found in request.headers" }
401 { "error": "Unauthorized" }

// Insufficient role
403 { "error": "Forbidden" }
```

---

## 2. Common Patterns

### Response Status Codes

| Status | Meaning          | Body                                     |
| ------ | ---------------- | ---------------------------------------- |
| `200`  | OK               | Resource or array                        |
| `201`  | Created          | Newly created resource                   |
| `204`  | No Content       | Empty                                    |
| `400`  | Validation Error | `{ error: { fieldErrors, formErrors } }` |
| `401`  | Unauthenticated  | `{ error: string }`                      |
| `403`  | Forbidden        | `{ error: "Forbidden" }`                 |
| `404`  | Not Found        | `{ error: string }`                      |
| `500`  | Server Error     | `{ error: string }`                      |
| `502`  | AI Service Error | `{ error: string }`                      |

### Validation Error Format

```json
{
  "error": {
    "fieldErrors": {
      "email": ["Invalid email"],
      "salary": ["Expected number, received string"]
    },
    "formErrors": []
  }
}
```

### Date Format

All dates are **ISO 8601 strings**: `"2025-12-31"` or `"2025-12-31T10:00:00.000Z"`

---

## 3. Employees

### Types

```ts
type EmployeeRole = 'employee' | 'manager'

interface Employee {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string
  role: EmployeeRole
  cnpj?: string
  salary: number
  hired_at: string // ISO date
  created_at: string
  updated_at: string
}

interface SalaryAdjustment {
  id: string
  employee_id: string
  previous_salary: number
  new_salary: number
  reason: string
  adjusted_at: string
}
```

---

### `GET /employees`

List all employees.

**Response `200`**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "role": "employee",
    "cnpj": null,
    "salary": 5000,
    "hired_at": "2024-01-15",
    "created_at": "2024-01-15T12:00:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z"
  }
]
```

---

### `GET /employees/:id`

Get a single employee.

**Response `200`** — `Employee`

**Response `404`**

```json
{ "error": "Not found" }
```

---

### `POST /employees`

Create a new employee.

> **Required role:** `manager` or `admin`

**Request Body**

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11999999999",
  "role": "employee",
  "cnpj": "12345678000195",
  "salary": 5000,
  "hired_at": "2024-01-15"
}
```

| Field      | Type     | Required | Validation                  |
| ---------- | -------- | -------- | --------------------------- |
| `name`     | `string` | Yes      | min 2 chars                 |
| `email`    | `string` | Yes      | valid email                 |
| `phone`    | `string` | Yes      | min 8 chars                 |
| `role`     | `string` | Yes      | `"employee"` or `"manager"` |
| `cnpj`     | `string` | No       | —                           |
| `salary`   | `number` | Yes      | positive                    |
| `hired_at` | `string` | Yes      | ISO date                    |

**Response `201`** — `Employee`

---

### `PUT /employees/:id`

Update an employee.

**Request Body** — same fields as `POST /employees` (all optional on update)

**Response `200`** — updated `Employee`

---

### `DELETE /employees/:id`

Delete an employee.

**Response `204`** — empty body

---

### `GET /employees/:id/salary-adjustments`

Get salary adjustment history for an employee.

**Response `200`**

```json
[
  {
    "id": "uuid",
    "employee_id": "uuid",
    "previous_salary": 4500,
    "new_salary": 5000,
    "reason": "Annual performance review",
    "adjusted_at": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### `POST /employees/:id/salary-adjustments`

Create a salary adjustment for an employee.

**Request Body**

```json
{
  "new_salary": 5500,
  "reason": "Promoted to senior level"
}
```

| Field        | Type     | Required | Validation  |
| ------------ | -------- | -------- | ----------- |
| `new_salary` | `number` | Yes      | positive    |
| `reason`     | `string` | Yes      | min 5 chars |

**Response `201`** — `SalaryAdjustment`

---

## 4. Machines

### Types

```ts
interface Machine {
  id: string
  name: string
  brand: string
  model: string
  serial_number: string
  year: number
  manual_url?: string // Set after manual upload
  created_at: string
  updated_at: string
}
```

---

### `GET /machines`

List all machines.

**Response `200`** — `Machine[]`

---

### `GET /machines/:id`

Get a single machine.

**Response `200`** — `Machine`

---

### `POST /machines`

Create a new machine.

**Request Body**

```json
{
  "name": "Inversor Solar X1",
  "brand": "SolarTech",
  "model": "XT-5000",
  "serial_number": "SN123456",
  "year": 2023,
  "manual_url": null
}
```

| Field           | Type     | Required | Validation                |
| --------------- | -------- | -------- | ------------------------- |
| `name`          | `string` | Yes      | min 2 chars               |
| `brand`         | `string` | Yes      | min 1 char                |
| `model`         | `string` | Yes      | min 1 char                |
| `serial_number` | `string` | Yes      | min 1 char                |
| `year`          | `number` | Yes      | 1900 to current year + 1  |
| `manual_url`    | `string` | No       | auto-set on manual upload |

**Response `201`** — `Machine`

---

### `PUT /machines/:id`

Update a machine.

**Request Body** — same fields as `POST /machines`

**Response `200`** — updated `Machine`

---

### `DELETE /machines/:id`

Delete a machine.

**Response `204`** — empty body

---

### `GET /machines/:id/jobs`

List all jobs associated with a machine.

**Response `200`**

```json
[
  {
    "id": "uuid",
    "scheduled_date": "2025-06-10",
    "city": "São Paulo",
    "state": "SP",
    "job_type": "commissioning",
    "status": "scheduled",
    "employee_name": "João Silva"
  }
]
```

---

### `POST /machines/:id/manual`

Upload a PDF manual for a machine.

> **Content-Type:** `multipart/form-data`
> **Max file size:** 50 MB

**Form Fields**

| Field  | Type   | Description    |
| ------ | ------ | -------------- |
| (file) | Binary | PDF file bytes |

**Example (JavaScript)**

```js
const formData = new FormData()
formData.append('file', pdfFile)

fetch('/machines/uuid/manual', {
  method: 'POST',
  headers: { Authorization: 'Bearer ...' },
  body: formData,
})
```

**Response `200`**

```json
{ "url": "https://supabase.co/storage/v1/object/public/machine-manuals/..." }
```

> After upload, the machine's `manual_url` is updated and the PDF is **asynchronously indexed** for the AI Chat feature. This indexing may take a few seconds.

---

## 5. Contracts

> ⚠️ **Doc drift note (2026-09-16):** this section was out of sync with the
> API for several sub-plans (still showed the pre-`clients`-table shape).
> Updated here as part of the PC/OS/Contract model rework (épico
> `ajustes-cliente-2026-09`, sub-plano 01) — see also the new **Proposals
> (PC)** section below, which this doc never had at all.
>
> **Sub-plano 01 revision:** accepting a PC (`PATCH /proposals/:id/accept`)
> no longer creates a Contract automatically — it only creates the OS (Job),
> linked to the PC and to the client directly. A Contract now only exists
> when created manually here (e.g. large/recurring rental agreements), and a
> PC can optionally link itself to one via `contract_id`. `GET
/contracts/:id` no longer embeds a single reverse `proposal` field (that
> was a 1:1 assumption that no longer holds — many PCs can link to the same
> Contract). To list the PCs/Jobs linked to a Contract, use `GET
/proposals?contractId=` and `GET /jobs?contractId=` (see below).

### Types

```ts
interface Contract {
  id: string
  client_id: string | null
  number?: string | null // Manual contracts have no auto-generated number
  description: string
  start_date: string
  end_date: string
  contract_type?: 'service' | 'rental'
  contract_value?: number
  recurring?: boolean
  file_url?: string // Set after file upload
  created_at: string
  updated_at: string
  clients?: { id: string; razao_social: string; cnpj: string } | null // Embedded
}
```

---

### `GET /contracts`

List all contracts. Supports `?clientId=` filter.

**Response `200`** — `Contract[]`

---

### `GET /contracts/expiring`

List contracts expiring within the next **30 days**.

**Response `200`** — `Contract[]` ordered by `end_date` ascending

---

### `GET /contracts/:id`

Get a single contract.

**Response `200`** — `Contract` (no longer includes an embedded `proposal` field — see note above)

---

### `POST /contracts`

Create a new contract.

> **Required role:** `manager` or `admin`

**Request Body**

```json
{
  "client_id": "uuid",
  "description": "Locação anual de inversores",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "contract_type": "rental",
  "contract_value": 15000,
  "recurring": true
}
```

| Field            | Type      | Required | Validation                        |
| ---------------- | --------- | -------- | --------------------------------- |
| `client_id`      | `string`  | Yes      | UUID                              |
| `description`    | `string`  | Yes      | min 1, max 2000 chars             |
| `start_date`     | `string`  | Yes      | ISO date                          |
| `end_date`       | `string`  | Yes      | ISO date, must be >= `start_date` |
| `contract_type`  | `string`  | No       | `"service"` or `"rental"`         |
| `contract_value` | `number`  | No       | >= 0                              |
| `recurring`      | `boolean` | No       | —                                 |

**Response `201`** — `Contract`

---

### `PUT /contracts/:id`

Update a contract (partial — all fields optional).

**Request Body** — same fields as `POST /contracts`, all optional

**Response `200`** — updated `Contract`

---

### `DELETE /contracts/:id`

Delete a contract.

> **Required role:** `admin`

**Response `204`** — empty body

---

### `POST /contracts/:id/file`

Upload a PDF file for a contract.

> **Content-Type:** `multipart/form-data`
> **Max file size:** 50 MB

**Form Fields**

| Field  | Type   | Description    |
| ------ | ------ | -------------- |
| (file) | Binary | PDF file bytes |

**Response `200`**

```json
{ "url": "https://supabase.co/storage/v1/object/public/contract-files/..." }
```

---

## 5A. Proposals (PC)

> **New section (2026-09-16).** This doc never documented `/proposals` at
> all, even though the PC (Proposta Comercial) has lived in its own table
> since an earlier sub-plano (`021_proposals_split.sql`). Added now as part
> of the PC/OS/Contract model rework (épico `ajustes-cliente-2026-09`,
> sub-plano 01), which changed the accept flow significantly.
>
> **What a PC is:** the commercial negotiation record with a client, created
> before any work exists. Accepting a PC (`PATCH /proposals/:id/accept`)
> creates the OS (Job) — linked to the PC via `jobs.proposal_id` and to the
> client via `jobs.client_id`. It does **not** create a Contract anymore. A
> PC may optionally link to an existing Contract (`contract_id`) — e.g. when
> it's a service call under an existing rental/recurring agreement — and the
> OS inherits that `contract_id` at accept time.

### Types

```ts
type ProposalStatus = 'pending' | 'accepted' | 'rejected'

interface Proposal {
  id: string
  number: string // Auto-generated, format "AAXXX" (e.g. "26001")
  client_id: string
  description: string
  contract_type?: 'service' | 'rental'
  contract_value?: number
  recurring: boolean
  start_date?: string // Optional — a PC may have no committed date yet
  file_url?: string
  status: ProposalStatus
  contract_id?: string | null // Optional link to an existing Contract (not auto-created anymore)
  job_id?: string | null // Set once accepted
  created_at: string
  updated_at: string
  clients?: { id: string; razao_social: string; cnpj: string } | null // Embedded
  contracts?: { id: string; number?: string } | null // Embedded, only when contract_id is set
  jobs?: {
    // Embedded, only when job_id is set
    id: string
    number?: string
    status: string
    scheduled_date?: string
    scheduled_end_date?: string
    city?: string
    state?: string
    employees?: { name: string } | null
    machines?: { name: string } | null
  } | null
}
```

---

### `GET /proposals`

List all PCs. Supports `?clientId=` and `?contractId=` filters.

**Response `200`** — `Proposal[]`

---

### `GET /proposals/:id`

Get a single PC.

**Response `200`** — `Proposal`

---

### `POST /proposals`

Create a new PC.

> **Required role:** `manager` or `admin`
> `number` and `status` are never accepted from the body — `number` is
> generated by the database, `status` always starts as `"pending"`.

**Request Body**

```json
{
  "client_id": "uuid",
  "description": "Comissionamento de inversores",
  "start_date": "2026-01-15",
  "contract_type": "service",
  "contract_value": 8000,
  "recurring": false,
  "contract_id": "uuid"
}
```

| Field            | Type      | Required | Validation                                                 |
| ---------------- | --------- | -------- | ---------------------------------------------------------- |
| `client_id`      | `string`  | Yes      | UUID                                                       |
| `description`    | `string`  | Yes      | min 1, max 2000 chars                                      |
| `start_date`     | `string`  | No       | ISO date — the PC may have no date yet                     |
| `contract_type`  | `string`  | No       | `"service"` or `"rental"`                                  |
| `contract_value` | `number`  | No       | >= 0                                                       |
| `recurring`      | `boolean` | No       | default `false`                                            |
| `file_url`       | `string`  | No       | —                                                          |
| `contract_id`    | `string`  | No       | UUID; must belong to the **same `client_id`** (else `400`) |

**Response `201`** — `Proposal`

---

### `PUT /proposals/:id`

Update a PC (partial — all fields optional, including `client_id`).

**Request Body** — same fields as `POST /proposals`, all optional

**Response `200`** — updated `Proposal`

---

### `PATCH /proposals/:id/accept`

Accept a pending PC. Creates **only** the OS (Job) — no Contract is created.
The Job is linked to the PC (`proposal_id`), the client (`client_id`), and
inherits `contract_id` from the PC when it has one already linked.

> **Required role:** `manager` or `admin`

**Response `200`**

```json
{
  "proposal": { "...": "Proposal, now status: \"accepted\", job_id set" },
  "job": {
    "id": "uuid",
    "proposal_id": "uuid",
    "client_id": "uuid",
    "contract_id": null,
    "number": "26001",
    "scheduled_date": "2026-01-15",
    "scope_detail": "Comissionamento de inversores",
    "status": "pending"
  }
}
```

**Error responses**

- `404` — PC not found
- `409` — PC is not `pending` (e.g. already accepted/rejected)

---

### `PATCH /proposals/:id/reject`

Reject a pending PC. No Contract/OS is created; the PC stays as a historical
record with `status: "rejected"`.

> **Required role:** `manager` or `admin`

**Response `200`** — updated `Proposal`

**Error responses**

- `404` — PC not found
- `409` — PC is not `pending`

---

## 6. Jobs

> ⚠️ **Doc drift note (2026-09-16):** this section did not reflect several
> prior sub-plans (missing `client_id`, `proposal_id`, `contract_id`,
> `number`, `scope_detail`, `bag_id`, `employee_ids`/`job_employees`,
> `scheduled_end_date`, etc.) and still showed the two legacy `job_type`
> values. Rewritten here as part of the PC/OS/Contract model rework (épico
> `ajustes-cliente-2026-09`, sub-plano 01).
>
> **`job_type` changed completely:** the 2 legacy values (`"maintenance"`,
> `"implementation"`) are gone — the check constraint now only accepts the 10
> new slugs below. Any job still holding a legacy value had `job_type` reset
> to `null` by the migration.
>
> **`PUT /jobs/:id` is now genuinely partial** — every field is optional.
> Before, the frontend had to resend the full job body to change a single
> field, which blocked incrementally completing a "skeleton" OS created by
> accepting a PC (that OS starts with only `proposal_id`/`client_id`/
> `contract_id`/`number`/`scheduled_date`/`scope_detail`/`status` set —
> everything else is `null` until the manager fills it in via one or more
> partial `PUT`s).

### Types

```ts
type JobType =
  | 'pre_commissioning'
  | 'commissioning'
  | 'pre_taf'
  | 'taf'
  | 'technical_visit'
  | 'field_survey'
  | 'studies'
  | 'bench_tests'
  | 'energization_support'
  | 'development'
type JobStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

interface Job {
  id: string
  employee_id: string | null // Nullable — a skeleton OS has no assignee yet
  machine_id: string | null
  job_type: JobType | null
  status: JobStatus
  description?: string | null
  scheduled_date?: string | null
  scheduled_end_date?: string | null // Optional — multi-day jobs
  city?: string | null
  state?: string | null // 2-letter state code, e.g. "SP"
  accommodation: boolean
  car: boolean
  start_time?: string | null
  end_time?: string | null
  notes?: string
  report_id?: string // Set when job is completed via report
  // Sub-plano 01 — direct links (fonte de verdade nova, replaces resolving the
  // client only through a Contract):
  proposal_id?: string | null // The PC that generated this OS, if any
  client_id?: string | null
  contract_id?: string | null // Only set when linked to a big/rental Contract
  number?: string | null // Copied from the PC's number at accept time
  scope_detail?: string | null
  bag_id?: string | null
  service_address?: string | null
  client_contact_name?: string | null
  client_contact_phone?: string | null
  employee_ids?: string[] // job_employees (many-to-many) — GET /:id only
  employee_name?: string // Flattened from relation
  machine_name?: string // Flattened from relation
  client_name?: string | null // Flattened — jobs.client_id first, falls back to contracts.client_id
  created_at: string
  updated_at: string
}

// GET /jobs/:id additionally includes:
interface JobDetail extends Job {
  machine: {
    name: string
    manual_url?: string
  } | null
  proposal: { id: string; number?: string; status: string } | null
}
```

---

### `GET /jobs`

List jobs. Supports `?contractId=` filter (lists the OS linked to a Contract).

> **Employee users** automatically receive **only their own jobs** (via
> `employee_id` or `job_employees`).
> **Manager/Admin** receive all jobs.

**Response `200`** — `Job[]`

---

### `GET /jobs/:id`

Get a single job with detailed machine info and the originating PC, if any.

**Response `200`** — `JobDetail`

```json
{
  "id": "uuid",
  "proposal_id": "uuid",
  "client_id": "uuid",
  "contract_id": null,
  "number": "26001",
  "employee_id": "uuid",
  "machine_id": "uuid",
  "job_type": "commissioning",
  "status": "pending",
  "description": null,
  "scope_detail": "Comissionamento de inversores",
  "scheduled_date": "2025-06-15",
  "scheduled_end_date": null,
  "city": "Campinas",
  "state": "SP",
  "accommodation": false,
  "car": true,
  "start_time": "08:00",
  "end_time": "17:00",
  "notes": "Levar kit de ferramentas completo",
  "report_id": null,
  "employee_name": "João Silva",
  "machine_name": "Inversor Solar X1",
  "client_name": "Empresa Solar Ltda",
  "employee_ids": ["uuid"],
  "machine": {
    "name": "Inversor Solar X1",
    "manual_url": "https://..."
  },
  "proposal": { "id": "uuid", "number": "26001", "status": "accepted" },
  "created_at": "2025-06-01T10:00:00.000Z",
  "updated_at": "2025-06-01T10:00:00.000Z"
}
```

---

### `POST /jobs`

Create a new job directly (manual/standalone OS — not via accepting a PC).

> **Required role:** `manager` or `admin`

> When a job is created, the assigned employee **automatically receives a notification** (if they have an associated user account).

**Request Body**

```json
{
  "employee_id": "uuid",
  "machine_id": "uuid",
  "job_type": "commissioning",
  "scheduled_date": "2025-06-15",
  "city": "Campinas",
  "state": "SP",
  "accommodation": false,
  "car": true,
  "start_time": "08:00",
  "end_time": "17:00",
  "notes": "Levar kit de ferramentas"
}
```

| Field                  | Type       | Required | Validation                                     |
| ---------------------- | ---------- | -------- | ---------------------------------------------- |
| `employee_id`          | `string`   | Yes      | min 1 char                                     |
| `machine_id`           | `string`   | Yes      | min 1 char                                     |
| `job_type`             | `string`   | Yes      | one of the 10 slugs above                      |
| `description`          | `string`   | No       | —                                              |
| `scheduled_date`       | `string`   | Yes      | ISO date                                       |
| `scheduled_end_date`   | `string`   | No       | ISO date, >= `scheduled_date` (multi-day jobs) |
| `city`                 | `string`   | Yes      | min 1 char                                     |
| `state`                | `string`   | Yes      | exactly 2 chars                                |
| `accommodation`        | `boolean`  | Yes      | —                                              |
| `car`                  | `boolean`  | Yes      | —                                              |
| `start_time`           | `string`   | Yes      | min 1 char (e.g. `"08:00"`)                    |
| `end_time`             | `string`   | Yes      | min 1 char                                     |
| `notes`                | `string`   | No       | —                                              |
| `scope_detail`         | `string`   | No       | —                                              |
| `bag_id`               | `string`   | No       | UUID of a test bag (`bags`)                    |
| `service_address`      | `string`   | No       | —                                              |
| `client_contact_name`  | `string`   | No       | —                                              |
| `client_contact_phone` | `string`   | No       | —                                              |
| `employee_ids`         | `string[]` | No       | Replaces `job_employees` (admin/manager only)  |
| `proposal_id`          | `string`   | No       | Manually link to a PC                          |
| `client_id`            | `string`   | No       | —                                              |
| `contract_id`          | `string`   | No       | Manually link to a big Contract                |

**Response `201`** — `Job`

---

### `PUT /jobs/:id`

Update a job — **all fields optional** (see doc drift note above). Send only
the fields you want to change.

> **Employees** may only send non-administrative fields (no `employee_id`,
> `machine_id`, `scheduled_date`, `scheduled_end_date`, `employee_ids`,
> `proposal_id`, `client_id`, `contract_id` — those are silently ignored if
> sent by an `employee`).

**Request Body** — any subset of the `POST /jobs` fields, e.g.:

```json
{ "job_type": "commissioning" }
```

**Response `200`** — updated `Job`

---

### `PATCH /jobs/:id/cancel`

Cancel a job.

**No request body required.**

**Response `200`** — `Job` with `status: "cancelled"`

---

## 7. Reports & Evidences

### Types

```ts
type EvidenceFileType = 'image' | 'pdf' | 'video' | 'audio'

interface JobReport {
  id: string
  job_id: string
  content: string
  employee_id: string
  submitted_at: string
}

interface Evidence {
  id: string
  report_id: string
  url: string
  mime_type: string
  file_name: string
  type: EvidenceFileType // Derived from mime_type
}

interface JobReportWithEvidences extends JobReport {
  evidences: Evidence[]
}
```

---

### `GET /jobs/:id/report`

Get the report for a specific job, including all evidences.

**Response `200`**

```json
{
  "id": "uuid",
  "job_id": "uuid",
  "content": "Manutenção realizada com sucesso. Substituído o capacitor do módulo 3.",
  "employee_id": "uuid",
  "submitted_at": "2025-06-15T17:30:00.000Z",
  "evidences": [
    {
      "id": "uuid",
      "report_id": "uuid",
      "url": "https://supabase.co/storage/v1/object/public/evidences/...",
      "mime_type": "image/jpeg",
      "file_name": "foto_capacitor.jpg",
      "type": "image"
    }
  ]
}
```

**Response `404`**

```json
{ "error": "Not found" }
```

---

### `POST /jobs/:id/report`

Submit a report for a completed job.

> **Side effects (automatic):**
>
> - Job `status` is set to `"completed"`
> - Job `report_id` is set to the new report's ID

**Request Body**

```json
{
  "content": "Manutenção realizada com sucesso. Substituído o capacitor do módulo 3."
}
```

| Field     | Type     | Required | Validation |
| --------- | -------- | -------- | ---------- |
| `content` | `string` | Yes      | min 1 char |

**Response `201`** — `JobReport`

```json
{
  "id": "uuid",
  "job_id": "uuid",
  "content": "Manutenção realizada com sucesso...",
  "employee_id": "uuid",
  "submitted_at": "2025-06-15T17:30:00.000Z"
}
```

---

### `POST /reports/:id/evidences`

Upload an evidence file to a report.

> **Content-Type:** `multipart/form-data`
> **Max file size:** 50 MB

**Allowed MIME types:**

| MIME Type         | `type` field |
| ----------------- | ------------ |
| `image/jpeg`      | `"image"`    |
| `image/png`       | `"image"`    |
| `application/pdf` | `"pdf"`      |
| `video/mp4`       | `"video"`    |
| `audio/mpeg`      | `"audio"`    |

**Form Fields**

| Field  | Type   | Description |
| ------ | ------ | ----------- |
| (file) | Binary | File bytes  |

**Example (JavaScript)**

```js
const formData = new FormData()
formData.append('file', evidenceFile)

fetch('/reports/uuid/evidences', {
  method: 'POST',
  headers: { Authorization: 'Bearer ...' },
  body: formData,
})
```

**Response `201`** — `Evidence`

```json
{
  "id": "uuid",
  "report_id": "uuid",
  "url": "https://supabase.co/storage/v1/object/public/evidences/...",
  "mime_type": "image/jpeg",
  "file_name": "foto_capacitor.jpg",
  "type": "image"
}
```

**Response `400`** — invalid file type

```json
{ "error": "Tipo application/xml não permitido" }
```

---

## 8. Transactions

### Types

```ts
type TransactionType = 'credit' | 'debit'

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  category: string
  destination?: string
  date: string
  created_at: string
}
```

---

### `GET /transactions`

List all transactions.

**Response `200`** — `Transaction[]`

---

### `POST /transactions`

Create a new transaction.

**Request Body**

```json
{
  "type": "debit",
  "amount": 1500.0,
  "description": "Compra de ferramentas",
  "category": "Equipamentos",
  "destination": "Fornecedor ABC",
  "date": "2025-06-01"
}
```

| Field         | Type     | Required | Validation              |
| ------------- | -------- | -------- | ----------------------- |
| `type`        | `string` | Yes      | `"credit"` or `"debit"` |
| `amount`      | `number` | Yes      | positive (`> 0`)        |
| `description` | `string` | Yes      | min 1 char              |
| `category`    | `string` | Yes      | min 1 char              |
| `destination` | `string` | No       | —                       |
| `date`        | `string` | Yes      | ISO date                |

**Response `201`** — `Transaction`

---

### `DELETE /transactions/:id`

Delete a transaction.

**Response `204`** — empty body

---

## 9. Notifications

### Types

```ts
interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  read: boolean
  created_at: string
}
```

---

### `GET /notifications`

Get **all notifications** for the authenticated user.

**Response `200`** — `Notification[]`

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Novo serviço agendado",
    "message": "Você tem um novo serviço agendado para 15/06/2025 em Campinas, SP.",
    "read": false,
    "created_at": "2025-06-01T10:00:00.000Z"
  }
]
```

---

### `PATCH /notifications/:id/read`

Mark a single notification as read.

**No request body required.**

**Response `204`** — empty body

---

### `PATCH /notifications/read-all`

Mark **all** notifications of the authenticated user as read.

**No request body required.**

**Response `204`** — empty body

> **Important:** This route must be called as `/notifications/read-all` — not `/notifications/:id/read` with id = `"read-all"`.

---

## 10. Chat (RAG)

AI-powered Q&A based on a machine's uploaded PDF manual.

> Requires the machine to have a manual uploaded via `POST /machines/:id/manual`.

---

### `POST /chat`

Ask a question about a machine based on its manual.

**Request Body**

```json
{
  "machineId": "uuid",
  "message": "Qual a tensão máxima de entrada do inversor?"
}
```

| Field       | Type     | Required | Validation |
| ----------- | -------- | -------- | ---------- |
| `machineId` | `string` | Yes      | min 1 char |
| `message`   | `string` | Yes      | min 1 char |

**Response `200`**

```json
{
  "answer": "A tensão máxima de entrada do inversor é 600V DC, conforme especificado na seção 3.2 do manual."
}
```

> If the answer cannot be found in the manual context, Claude responds with:
> `"Não encontrei essa informação no manual."`

**Response `404`** — Manual not yet indexed

```json
{ "error": "Manual não indexado para esta máquina" }
```

**Response `502`** — AI service error

```json
{ "error": "Erro ao consultar a IA. Tente novamente." }
```

---

## 11. Error Reference

### Validation Errors (`400`)

All validation errors follow this structure:

```ts
{
  error: {
    fieldErrors: Record<string, string[]>
    formErrors: string[]
  }
}
```

**Example**

```json
{
  "error": {
    "fieldErrors": {
      "email": ["Invalid email"],
      "salary": ["Number must be greater than 0"],
      "state": ["String must contain exactly 2 character(s)"]
    },
    "formErrors": []
  }
}
```

### File Upload Errors (`400`)

```json
{ "error": "Arquivo não enviado" }
{ "error": "Tipo application/json não permitido" }
```

### Not Found (`404`)

```json
{ "error": "Not found" }
```

### Auth Errors

```json
// No token
{ "error": "No Authorization was found in request.headers" }

// Invalid token
{ "error": "Unauthorized" }

// Wrong role
{ "error": "Forbidden" }
```

### Server & AI Errors

```json
// Generic server error
{ "error": "Internal server error message" }

// AI service unavailable
{ "error": "Erro ao consultar a IA. Tente novamente." }
```

---

## Appendix: Job Status Flow

> **Sub-plano 01 update:** an OS can now also start from `PATCH
/proposals/:id/accept` (status `"pending"`, most fields `null` until
> completed via one or more partial `PUT /jobs/:id`), not only from `POST
/jobs` (status `"scheduled"`, fully filled in immediately).

```
POST /jobs                    PATCH /proposals/:id/accept
    │                                │
    ▼                                ▼
 "scheduled"                     "pending"
    │                                │
    │                    PUT /jobs/:id (one or more, partial)
    │                                │
    ├── PATCH /jobs/:id/cancel ──► "cancelled"
    │
    └── (Employee updates status)
            │
            ▼
       "in_progress"
            │
            └── POST /jobs/:id/report ──► "completed"
```

## Appendix: File Upload Buckets

| Bucket            | Endpoint                      | Accepted Types           |
| ----------------- | ----------------------------- | ------------------------ |
| `machine-manuals` | `POST /machines/:id/manual`   | PDF                      |
| `contract-files`  | `POST /contracts/:id/file`    | PDF                      |
| `evidences`       | `POST /reports/:id/evidences` | JPEG, PNG, PDF, MP4, MP3 |

All uploaded files return a **public URL** that can be used directly in `<img>`, `<video>`, `<audio>`, or `<a>` tags.

## Appendix: Role Permissions Summary

| Action                    | `employee` | `manager` | `admin` |
| ------------------------- | :--------: | :-------: | :-----: |
| Read employees            |     ✓      |     ✓     |    ✓    |
| Create employee           |     ✗      |     ✓     |    ✓    |
| Read all jobs             |     ✗      |     ✓     |    ✓    |
| Read own jobs             |     ✓      |     ✓     |    ✓    |
| Create job                |     ✗      |     ✓     |    ✓    |
| Submit report             |     ✓      |     ✓     |    ✓    |
| Upload evidence           |     ✓      |     ✓     |    ✓    |
| Read machines / contracts |     ✓      |     ✓     |    ✓    |
| Create machine / contract |     ✓      |     ✓     |    ✓    |
| Upload machine manual     |     ✓      |     ✓     |    ✓    |
| Read/manage transactions  |     ✓      |     ✓     |    ✓    |
| Read own notifications    |     ✓      |     ✓     |    ✓    |
| Chat (RAG)                |     ✓      |     ✓     |    ✓    |
