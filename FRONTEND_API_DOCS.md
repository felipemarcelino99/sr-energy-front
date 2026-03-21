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

| Role       | Description                            |
|------------|----------------------------------------|
| `admin`    | Full access                            |
| `manager`  | Can create employees, jobs, etc.       |
| `employee` | Restricted to own data                 |

### Authenticated User Object

Every authenticated request has access to the following user context (resolved server-side from the token):

```ts
{
  id: string      // Supabase Auth user ID
  email: string
  role: "admin" | "manager" | "employee"
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

| Status | Meaning              | Body                        |
|--------|----------------------|-----------------------------|
| `200`  | OK                   | Resource or array           |
| `201`  | Created              | Newly created resource      |
| `204`  | No Content           | Empty                       |
| `400`  | Validation Error     | `{ error: { fieldErrors, formErrors } }` |
| `401`  | Unauthenticated      | `{ error: string }`         |
| `403`  | Forbidden            | `{ error: "Forbidden" }`    |
| `404`  | Not Found            | `{ error: string }`         |
| `500`  | Server Error         | `{ error: string }`         |
| `502`  | AI Service Error     | `{ error: string }`         |

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
type EmployeeRole = "employee" | "manager"

interface Employee {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string
  role: EmployeeRole
  cnpj?: string
  salary: number
  hired_at: string        // ISO date
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

| Field      | Type     | Required | Validation                       |
|------------|----------|----------|----------------------------------|
| `name`     | `string` | Yes      | min 2 chars                      |
| `email`    | `string` | Yes      | valid email                      |
| `phone`    | `string` | Yes      | min 8 chars                      |
| `role`     | `string` | Yes      | `"employee"` or `"manager"`      |
| `cnpj`     | `string` | No       | —                                |
| `salary`   | `number` | Yes      | positive                         |
| `hired_at` | `string` | Yes      | ISO date                         |

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

| Field        | Type     | Required | Validation |
|--------------|----------|----------|------------|
| `new_salary` | `number` | Yes      | positive   |
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
  manual_url?: string     // Set after manual upload
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

| Field           | Type     | Required | Validation                      |
|-----------------|----------|----------|---------------------------------|
| `name`          | `string` | Yes      | min 2 chars                     |
| `brand`         | `string` | Yes      | min 1 char                      |
| `model`         | `string` | Yes      | min 1 char                      |
| `serial_number` | `string` | Yes      | min 1 char                      |
| `year`          | `number` | Yes      | 1900 to current year + 1        |
| `manual_url`    | `string` | No       | auto-set on manual upload       |

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
    "job_type": "maintenance",
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
|--------|--------|----------------|
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

### Types

```ts
interface Contract {
  id: string
  client_name: string
  client_cnpj: string
  description: string
  start_date: string
  end_date: string
  file_url?: string     // Set after file upload
  created_at: string
  updated_at: string
}
```

---

### `GET /contracts`

List all contracts.

**Response `200`** — `Contract[]`

---

### `GET /contracts/expiring`

List contracts expiring within the next **30 days**.

**Response `200`** — `Contract[]` ordered by `end_date` ascending

---

### `GET /contracts/:id`

Get a single contract.

**Response `200`** — `Contract`

---

### `POST /contracts`

Create a new contract.

**Request Body**
```json
{
  "client_name": "Empresa Solar Ltda",
  "client_cnpj": "12345678000195",
  "description": "Manutenção anual de inversores",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```

| Field          | Type     | Required | Validation                         |
|----------------|----------|----------|------------------------------------|
| `client_name`  | `string` | Yes      | min 2 chars                        |
| `client_cnpj`  | `string` | Yes      | min 14 chars                       |
| `description`  | `string` | Yes      | min 1 char                         |
| `start_date`   | `string` | Yes      | ISO date                           |
| `end_date`     | `string` | Yes      | ISO date, must be >= `start_date`  |

**Response `201`** — `Contract`

---

### `PUT /contracts/:id`

Update a contract.

**Request Body** — same fields as `POST /contracts`

**Response `200`** — updated `Contract`

---

### `DELETE /contracts/:id`

Delete a contract.

**Response `204`** — empty body

---

### `POST /contracts/:id/file`

Upload a PDF file for a contract.

> **Content-Type:** `multipart/form-data`
> **Max file size:** 50 MB

**Form Fields**

| Field  | Type   | Description    |
|--------|--------|----------------|
| (file) | Binary | PDF file bytes |

**Response `200`**
```json
{ "url": "https://supabase.co/storage/v1/object/public/contract-files/..." }
```

---

## 6. Jobs

### Types

```ts
type JobType   = "maintenance" | "implementation"
type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled"

interface Job {
  id: string
  employee_id: string
  machine_id: string
  job_type: JobType
  status: JobStatus
  description: string
  scheduled_date: string
  city: string
  state: string             // 2-letter state code, e.g. "SP"
  accommodation: boolean
  car: boolean
  start_time: string
  end_time: string
  notes?: string
  report_id?: string        // Set when job is completed via report
  employee_name: string     // Flattened from relation
  machine_name: string      // Flattened from relation
  created_at: string
  updated_at: string
}

// GET /jobs/:id additionally includes:
interface JobDetail extends Job {
  machine: {
    name: string
    manual_url?: string
  }
}
```

---

### `GET /jobs`

List jobs.

> **Employee users** automatically receive **only their own jobs**.
> **Manager/Admin** receive all jobs.

**Response `200`** — `Job[]`

---

### `GET /jobs/:id`

Get a single job with detailed machine info.

**Response `200`** — `JobDetail`

```json
{
  "id": "uuid",
  "employee_id": "uuid",
  "machine_id": "uuid",
  "job_type": "maintenance",
  "status": "scheduled",
  "description": "Revisão geral do inversor",
  "scheduled_date": "2025-06-15",
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
  "machine": {
    "name": "Inversor Solar X1",
    "manual_url": "https://..."
  },
  "created_at": "2025-06-01T10:00:00.000Z",
  "updated_at": "2025-06-01T10:00:00.000Z"
}
```

---

### `POST /jobs`

Create a new job.

> **Required role:** `manager` or `admin`

> When a job is created, the assigned employee **automatically receives a notification** (if they have an associated user account).

**Request Body**
```json
{
  "employee_id": "uuid",
  "machine_id": "uuid",
  "job_type": "maintenance",
  "description": "Revisão geral do inversor",
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

| Field            | Type      | Required | Validation                              |
|------------------|-----------|----------|-----------------------------------------|
| `employee_id`    | `string`  | Yes      | min 1 char                              |
| `machine_id`     | `string`  | Yes      | min 1 char                              |
| `job_type`       | `string`  | Yes      | `"maintenance"` or `"implementation"`   |
| `description`    | `string`  | Yes      | min 1 char                              |
| `scheduled_date` | `string`  | Yes      | ISO date                                |
| `city`           | `string`  | Yes      | min 1 char                              |
| `state`          | `string`  | Yes      | exactly 2 chars                         |
| `accommodation`  | `boolean` | Yes      | —                                       |
| `car`            | `boolean` | Yes      | —                                       |
| `start_time`     | `string`  | Yes      | min 1 char (e.g. `"08:00"`)             |
| `end_time`       | `string`  | Yes      | min 1 char                              |
| `notes`          | `string`  | No       | —                                       |

**Response `201`** — `Job`

---

### `PUT /jobs/:id`

Update a job.

**Request Body** — same fields as `POST /jobs`

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
type EvidenceFileType = "image" | "pdf" | "video" | "audio"

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
  type: EvidenceFileType   // Derived from mime_type
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
> - Job `status` is set to `"completed"`
> - Job `report_id` is set to the new report's ID

**Request Body**
```json
{
  "content": "Manutenção realizada com sucesso. Substituído o capacitor do módulo 3."
}
```

| Field     | Type     | Required | Validation |
|-----------|----------|----------|------------|
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

| MIME Type      | `type` field |
|----------------|--------------|
| `image/jpeg`   | `"image"`    |
| `image/png`    | `"image"`    |
| `application/pdf` | `"pdf"`   |
| `video/mp4`    | `"video"`    |
| `audio/mpeg`   | `"audio"`    |

**Form Fields**

| Field  | Type   | Description      |
|--------|--------|------------------|
| (file) | Binary | File bytes       |

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
type TransactionType = "credit" | "debit"

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
  "amount": 1500.00,
  "description": "Compra de ferramentas",
  "category": "Equipamentos",
  "destination": "Fornecedor ABC",
  "date": "2025-06-01"
}
```

| Field         | Type     | Required | Validation                     |
|---------------|----------|----------|--------------------------------|
| `type`        | `string` | Yes      | `"credit"` or `"debit"`        |
| `amount`      | `number` | Yes      | positive (`> 0`)               |
| `description` | `string` | Yes      | min 1 char                     |
| `category`    | `string` | Yes      | min 1 char                     |
| `destination` | `string` | No       | —                              |
| `date`        | `string` | Yes      | ISO date                       |

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

| Field       | Type     | Required | Validation  |
|-------------|----------|----------|-------------|
| `machineId` | `string` | Yes      | min 1 char  |
| `message`   | `string` | Yes      | min 1 char  |

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

```
POST /jobs
    │
    ▼
 "scheduled"
    │
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

| Bucket             | Endpoint                        | Accepted Types         |
|--------------------|---------------------------------|------------------------|
| `machine-manuals`  | `POST /machines/:id/manual`     | PDF                    |
| `contract-files`   | `POST /contracts/:id/file`      | PDF                    |
| `evidences`        | `POST /reports/:id/evidences`   | JPEG, PNG, PDF, MP4, MP3 |

All uploaded files return a **public URL** that can be used directly in `<img>`, `<video>`, `<audio>`, or `<a>` tags.

## Appendix: Role Permissions Summary

| Action                            | `employee` | `manager` | `admin` |
|-----------------------------------|:----------:|:---------:|:-------:|
| Read employees                    | ✓          | ✓         | ✓       |
| Create employee                   | ✗          | ✓         | ✓       |
| Read all jobs                     | ✗          | ✓         | ✓       |
| Read own jobs                     | ✓          | ✓         | ✓       |
| Create job                        | ✗          | ✓         | ✓       |
| Submit report                     | ✓          | ✓         | ✓       |
| Upload evidence                   | ✓          | ✓         | ✓       |
| Read machines / contracts         | ✓          | ✓         | ✓       |
| Create machine / contract         | ✓          | ✓         | ✓       |
| Upload machine manual             | ✓          | ✓         | ✓       |
| Read/manage transactions          | ✓          | ✓         | ✓       |
| Read own notifications            | ✓          | ✓         | ✓       |
| Chat (RAG)                        | ✓          | ✓         | ✓       |
