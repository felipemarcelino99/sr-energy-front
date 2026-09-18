import { z } from 'zod'

// Sub-plano 04 (épico ajustes-cliente-2026-09), item 1: 10 tipos de serviço
// novos (slugs), substituindo os 2 antigos ('maintenance'/'implementation').
// Mantido em sincronia manual com o `jobTypeEnum` do backend
// (sr-energy-api/src/routes/jobs.ts).
export type JobType =
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
export type JobStatus = 'scheduled' | 'pending' | 'in_progress' | 'completed' | 'cancelled'

// ---- Type display (centralized — single source of truth, mesmo padrão de JOB_STATUS_LABEL) ----

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  pre_commissioning: 'Pré-comissionamento',
  commissioning: 'Comissionamento',
  pre_taf: 'Pré-TAF',
  taf: 'TAF',
  technical_visit: 'Visita técnica',
  field_survey: 'Levantamento de campo',
  studies: 'Estudos',
  bench_tests: 'Testes de bancada',
  energization_support: 'Apoio à energização',
  development: 'Desenvolvimento',
}

export interface Job {
  id: string
  /**
   * Código da OS. Mesmo conceito/valor do `number` da PC (Proposta Comercial)
   * que a originou, quando a OS nasce de `PATCH /proposals/:id/accept` —
   * formato `AAXXX`, gerado pelo banco.
   */
  number?: string
  /** Assignee legado (usado pelo provisionamento de ferramentas). Fonte de verdade de colaboradores é `employeeIds`. */
  employeeId: string
  employeeName: string
  machineId: string
  machineName: string
  jobType: JobType
  status: JobStatus
  scheduledDate: string
  /** Data final do serviço, quando a OS se estende por mais de um dia. `null`/ausente = serviço de um dia só. */
  scheduledEndDate?: string | null
  city: string
  state: string
  address?: string
  accommodation: boolean
  car: boolean
  startTime: string
  endTime: string
  carPickupTime?: string
  carReturnTime?: string
  carPickupAddress?: string
  notes?: string
  reportId?: string
  createdAt: string
  updatedAt: string

  // ---- Extended fields (item 12 — formulário estendido de OS) ----
  /** Fonte de verdade de colaboradores no formulário novo (substitui `employeeId` por completo no PUT). */
  employeeIds: string[]
  /** PC (Proposta Comercial) de origem, quando a OS nasceu de uma proposta aceita. `null`/ausente se criada manualmente. */
  proposalId?: string | null
  /** Cliente da OS (via `jobs.client_id`, direto — não depende mais de resolver por contrato). */
  clientId?: string | null
  /** Contrato grande/recorrente vinculado, quando a OS pertence a um (opcional — a maioria das OS não tem). */
  contractId?: string | null
  scopeDetail?: string
  bagId?: string
  serviceAddress?: string
  clientContactName?: string
  clientContactPhone?: string
  /** PC (Proposta Comercial) de origem — versão embutida com número, retornada por `GET /jobs/:id`. `null` se criada manualmente. */
  proposal?: { id: string; number: string } | null
  /** Nome da empresa/cliente. `null` para OS manual/legado sem cliente vinculado. */
  clientName?: string | null
}

// ---- Stepper schemas (one per step) ----

// Sub-plano 04, item 1: `employeeId` sai do schema — a fonte de verdade de
// colaboradores passa a ser só `employeeIds` (o select duplicado de
// funcionário único foi removido do passo 1 do stepper). O `employeeId`
// legado exigido pelo `POST /jobs` do backend é derivado de
// `employeeIds[0]` no submit (ver JobStepper.tsx), não é mais um campo do
// formulário.
export const jobStep1Schema = z.object({
  scheduledDate: z.string().min(1, 'Data é obrigatória'),
  scheduledEndDate: z.string().nullable().optional(),
  employeeIds: z.array(z.string()).min(1, 'Selecione ao menos um colaborador'),
})

export const jobStep2Schema = z.object({
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório').max(2, 'Use a sigla do estado (ex: SP)'),
  address: z.string().optional(),
  accommodation: z.boolean(),
  car: z.boolean(),
  startTime: z.string().min(1, 'Horário de início é obrigatório'),
  endTime: z.string().min(1, 'Horário de término é obrigatório'),
  carPickupTime: z.string().optional(),
  carReturnTime: z.string().optional(),
  carPickupAddress: z.string().optional(),
  serviceAddress: z.string().optional(),
  clientContactName: z.string().optional(),
  clientContactPhone: z.string().optional(),
})

// Sub-plano 04, item 1/3: `description` sai do schema (a UI deixou de
// exigi-la — o detalhamento do escopo, quando necessário, fica em
// `scopeDetail`, opcional). `proposalId` entra ao lado de `contractId` como
// pass-through opcional (preservado no submit quando a OS já vem vinculada a
// uma PC/contrato — não são campos editáveis nesta etapa).
export const jobStep3Schema = z.object({
  machineId: z.string().min(1, 'Equipamento é obrigatório'),
  jobType: z.enum([
    'pre_commissioning',
    'commissioning',
    'pre_taf',
    'taf',
    'technical_visit',
    'field_survey',
    'studies',
    'bench_tests',
    'energization_support',
    'development',
  ]),
  notes: z.string().optional(),
  contractId: z.string().optional(),
  proposalId: z.string().optional(),
  scopeDetail: z.string().optional(),
  bagId: z.string().optional(),
})

export const jobSchema = jobStep1Schema.merge(jobStep2Schema).merge(jobStep3Schema)

export type JobStep1Data = z.infer<typeof jobStep1Schema>
export type JobStep2Data = z.infer<typeof jobStep2Schema>
export type JobStep3Data = z.infer<typeof jobStep3Schema>
/**
 * `employeeId` não é mais validado pelo schema (ver `jobStep1Schema`), mas
 * continua fazendo parte do payload enviado ao backend — `POST /jobs` ainda
 * exige `employee_id` (assignee legado), derivado de `employeeIds[0]` pelo
 * `JobStepper`. `clientId` idem: nunca editável em formulário, só
 * preservado no submit de edição quando já presente.
 */
export type JobFormData = z.infer<typeof jobSchema> & {
  employeeId?: string
  clientId?: string
}

export interface JobDetail extends Job {
  machine: { name: string; manualUrl?: string }
}

// ---- Status display (centralized — single source of truth for label/badge color) ----

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  pending: 'Pendente',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const JOB_STATUS_BADGE_CLASS: Record<JobStatus, string> = {
  pending: 'badge-neutral',
  scheduled: 'badge-warning',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error badge-outline',
}

/** Rótulo de um `JobType`, com fallback pro slug cru — nunca deve aparecer em uso normal, só como salvaguarda. */
export function jobTypeLabel(jobType: JobType | string | null | undefined): string {
  if (!jobType) return '—'
  return JOB_TYPE_LABELS[jobType as JobType] ?? jobType
}
