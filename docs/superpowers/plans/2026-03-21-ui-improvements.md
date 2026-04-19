# UI Improvements — Dashboard, Jobs & Machines

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar a usabilidade e segurança das telas de Dashboard, Trabalhos e Máquinas.

**Architecture:** Cada subsistema é independente. As mudanças são principalmente de UI/UX nas views/pages existentes, com pequenas adições a modelos, serviços e viewmodels onde necessário. TDD estrito: testes antes de implementação.

**Tech Stack:** React 19, TypeScript, Tailwind/DaisyUI, Zustand, React Router DOM v7, Jest + Testing Library, Zod

> **Nota de escopo:** Estes são 3 subsistemas independentes. Podem ser executados em qualquer ordem, mas cada seção deve ser completada antes de passar para a próxima para evitar conflitos.

---

## Arquivos Afetados

### Dashboard
- Modify: `src/views/pages/ManagerDashboardPage.tsx`
- Modify: `src/views/components/JobStatusCard.tsx`
- Modify: `src/__tests__/views/JobStatusCard.test.tsx`
- Modify: `src/__tests__/views/ManagerDashboardPage.test.tsx` (se existir, senão criar)

### Jobs
- Modify: `src/views/pages/JobListPage.tsx`
- Modify: `src/views/pages/JobFormPage.tsx`
- Modify: `src/views/pages/ManagerJobDetailPage.tsx`
- Modify: `src/views/components/JobStepper.tsx`
- Modify: `src/viewmodels/job.viewmodel.ts`
- Modify: `src/__tests__/viewmodels/job.viewmodel.test.ts`
- Modify: `src/__tests__/views/JobListPage.test.tsx` (se existir, senão criar)
- Create: `src/views/components/JobReadOnlyView.tsx`
- Create: `src/__tests__/views/JobReadOnlyView.test.tsx`

### Machines
- Modify: `src/views/pages/MachineFormPage.tsx`
- Modify: `src/views/components/MachineJobHistory.tsx`
- Modify: `src/models/machine.model.ts`
- Modify: `src/services/machine.service.ts`
- Create: `src/views/components/MachineCompanies.tsx`
- Create: `src/__tests__/views/MachineCompanies.test.tsx`
- Modify: `src/__tests__/views/MachineJobHistory.test.tsx`
- Modify: `src/__tests__/views/MachineFormPage.test.tsx` (se existir, senão criar)

---

## SEÇÃO A — Dashboard

### Task A1: Remover resumo financeiro do Dashboard

**Contexto:** `ManagerDashboardPage` importa e renderiza `<FinancialCard summary={summary} />` no grid de KPIs. Remover este componente e o uso de `financialSummary()` do store.

**Files:**
- Modify: `src/views/pages/ManagerDashboardPage.tsx`

- [ ] **Step A1.1: Escrever teste que falha — asserting FinancialCard não está presente**

Criar ou editar `src/__tests__/views/ManagerDashboardPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ManagerDashboardPage } from '@/views/pages/ManagerDashboardPage'
import { useDashboardStore } from '@/viewmodels/dashboard.viewmodel'

jest.mock('@/viewmodels/dashboard.viewmodel')

beforeEach(() => {
  ;(useDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: false,
    error: null,
    loadDashboard: jest.fn(),
    financialSummary: () => ({ totalIncome: 1000, totalExpense: 500, balance: 500 }),
    jobStatusSummary: () => [],
    contractsExpiringSoon: () => [],
    jobs: [],
  })
})

it('não renderiza o resumo financeiro (FinancialCard)', () => {
  render(<MemoryRouter><ManagerDashboardPage /></MemoryRouter>)
  expect(screen.queryByTestId('financial-card')).not.toBeInTheDocument()
  // Se FinancialCard usa texto "Receita" ou "Despesa", garantir que não aparece:
  expect(screen.queryByText(/receita|despesa|saldo/i)).not.toBeInTheDocument()
})
```

- [ ] **Step A1.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="ManagerDashboardPage" --watchAll=false
```

Esperado: FAIL — FinancialCard ainda está presente

- [ ] **Step A1.2: Remover FinancialCard da ManagerDashboardPage**

Em `src/views/pages/ManagerDashboardPage.tsx`:
1. Remover o import de `FinancialCard` e `FinancialCard.tsx`
2. Remover a chamada `const summary = financialSummary()`
3. Remover `financialSummary` da desestruturação de `useDashboardStore()`
4. Substituir o grid `grid-cols-1 lg:grid-cols-2` por apenas `<JobStatusCard summary={statusSummary} />` (sem grid, ocupa largura total)

O resultado final do bloco KPI deve ser:
```tsx
{/* KPI row */}
<JobStatusCard summary={statusSummary} />
```

- [ ] **Step A1.3: Rodar testes para verificar que nada quebrou**

```bash
npm test -- --testPathPattern="dashboard|Dashboard" --watchAll=false
```

- [ ] **Step A1.4: Commit**

```bash
git add src/views/pages/ManagerDashboardPage.tsx
git commit -m "feat(dashboard): remove financial summary for privacy"
```

---

### Task A2: JobStatusCard clicável — navegar para listagem filtrada por status

**Contexto:** `JobStatusCard` renderiza 4 cards (scheduled, in_progress, completed, cancelled) num grid 2x2. Ao clicar em um card, deve navegar para `/jobs?status=<valor>`. O componente precisa aceitar um callback `onStatusClick(status: string)`.

**Files:**
- Modify: `src/views/components/JobStatusCard.tsx`
- Modify: `src/views/pages/ManagerDashboardPage.tsx`
- Modify: `src/__tests__/views/JobStatusCard.test.tsx`

- [ ] **Step A2.1: Escrever testes para o comportamento clicável**

Abrir `src/__tests__/views/JobStatusCard.test.tsx` e adicionar:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { JobStatusCard } from '@/views/components/JobStatusCard'

const mockSummary = [
  { status: 'scheduled', count: 3 },
  { status: 'in_progress', count: 1 },
  { status: 'completed', count: 5 },
  { status: 'cancelled', count: 2 },
]

describe('JobStatusCard — clicável', () => {
  it('chama onStatusClick com o status correto ao clicar no card', () => {
    const onStatusClick = jest.fn()
    render(<JobStatusCard summary={mockSummary} onStatusClick={onStatusClick} />)
    fireEvent.click(screen.getByTestId('status-card-scheduled'))
    expect(onStatusClick).toHaveBeenCalledWith('scheduled')
  })

  it('não lança erro se onStatusClick não for passado', () => {
    expect(() =>
      render(<JobStatusCard summary={mockSummary} />)
    ).not.toThrow()
  })

  it('aplica cursor-pointer quando onStatusClick está definido', () => {
    const onStatusClick = jest.fn()
    render(<JobStatusCard summary={mockSummary} onStatusClick={onStatusClick} />)
    const card = screen.getByTestId('status-card-scheduled')
    expect(card.className).toContain('cursor-pointer')
  })
})
```

- [ ] **Step A2.2: Rodar testes para verificar que falham**

```bash
npm test -- --testPathPattern="JobStatusCard" --watchAll=false
```

Esperado: FAIL — `data-testid="status-card-scheduled"` não existe ainda.

- [ ] **Step A2.3: Atualizar JobStatusCard para aceitar onStatusClick e adicionar data-testid**

```tsx
interface JobStatusCardProps {
  summary: JobStatusSummary[]
  onStatusClick?: (status: string) => void
}

export function JobStatusCard({ summary, onStatusClick }: JobStatusCardProps) {
  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body gap-4">
        <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Trabalhos por Status
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {summary.map(({ status, count }) => {
            const cfg = STATUS_CONFIG[status]
            if (!cfg) return null
            const Icon = cfg.icon
            return (
              <div
                key={status}
                data-testid={`status-card-${status}`}
                role={onStatusClick ? 'button' : undefined}
                tabIndex={onStatusClick ? 0 : undefined}
                onClick={() => onStatusClick?.(status)}
                onKeyDown={(e) => e.key === 'Enter' && onStatusClick?.(status)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 ${cfg.borderColor} ${cfg.bgColor} ${onStatusClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                <Icon size={14} className={`${cfg.textColor} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-base-content/40 truncate">{cfg.label}</p>
                  <p className={`text-xl font-bold num leading-tight ${cfg.textColor}`} data-testid={`count-${status}`}>
                    {count}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step A2.4: Atualizar ManagerDashboardPage para passar o handler de navegação**

```tsx
// Adicionar import de useNavigate
import { useNavigate } from 'react-router-dom'

// Dentro do componente:
const navigate = useNavigate()

// No JSX:
<JobStatusCard
  summary={statusSummary}
  onStatusClick={(status) => navigate(`/jobs?status=${status}`)}
/>
```

- [ ] **Step A2.5: Rodar testes**

```bash
npm test -- --testPathPattern="JobStatusCard|Dashboard" --watchAll=false
```

Esperado: PASS

- [ ] **Step A2.6: Commit**

```bash
git add src/views/components/JobStatusCard.tsx src/views/pages/ManagerDashboardPage.tsx src/__tests__/views/JobStatusCard.test.tsx
git commit -m "feat(dashboard): make job status cards clickable to filter jobs by status"
```

---

### Task A3: Linhas da tabela de trabalhos recentes são clicáveis

**Contexto:** A tabela "Trabalhos Recentes" em `ManagerDashboardPage` não tem navegação ao clicar. Cada row deve navegar para `/jobs/:id`.

**Files:**
- Modify: `src/views/pages/ManagerDashboardPage.tsx`

- [ ] **Step A3.1: Escrever teste que falha — row navega ao clicar**

Em `src/__tests__/views/ManagerDashboardPage.test.tsx`, adicionar:

```tsx
import { useNavigate } from 'react-router-dom'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

it('navega para /jobs/:id ao clicar numa row de trabalho recente', () => {
  const navigate = jest.fn()
  ;(useNavigate as jest.Mock).mockReturnValue(navigate)
  ;(useDashboardStore as unknown as jest.Mock).mockReturnValue({
    loading: false,
    error: null,
    loadDashboard: jest.fn(),
    financialSummary: () => ({}),
    jobStatusSummary: () => [],
    contractsExpiringSoon: () => [],
    jobs: [{ id: 'job-99', title: 'Trabalho Teste', employeeName: 'Ana', scheduledAt: '2024-01-01', status: 'scheduled' }],
  })
  render(<MemoryRouter><ManagerDashboardPage /></MemoryRouter>)
  fireEvent.click(screen.getByText('Trabalho Teste'))
  expect(navigate).toHaveBeenCalledWith('/jobs/job-99')
})
```

Adicionar `import { fireEvent } from '@testing-library/react'` ao arquivo.

- [ ] **Step A3.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="ManagerDashboardPage" --watchAll=false
```

Esperado: FAIL — clicar na row não dispara navigate ainda

- [ ] **Step A3.2: Atualizar ManagerDashboardPage — rows clicáveis**

Adicionar `useNavigate` (já foi adicionado no Task A2). Atualizar cada `<tr>` da tabela:

```tsx
{jobs.slice(0, 10).map((job) => (
  <tr
    key={job.id}
    className="border-base-300 hover:bg-base-300/30 transition-colors cursor-pointer"
    onClick={() => navigate(`/jobs/${job.id}`)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs/${job.id}`)}
  >
    {/* ... células ... */}
  </tr>
))}
```

- [ ] **Step A3.3: Rodar testes**

```bash
npm test -- --testPathPattern="ManagerDashboardPage" --watchAll=false
```

Esperado: PASS

- [ ] **Step A3.4: Commit**

```bash
git add src/views/pages/ManagerDashboardPage.tsx
git commit -m "feat(dashboard): navigate to job detail on row click"
```

---

## SEÇÃO B — Trabalhos (Jobs)

### Task B1: Aplicar filtro de status via query param na URL

**Contexto:** O JobStatusCard agora navega para `/jobs?status=<valor>`. A `JobListPage` precisa ler o query param `status` da URL ao montar e aplicar o filtro automaticamente.

**Files:**
- Modify: `src/views/pages/JobListPage.tsx`

- [ ] **Step B1.1: Escrever teste que falha — filtro aplicado via query param**

Em `src/__tests__/views/JobListPage.test.tsx`, adicionar:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Reutilizar o mock de useJobStore já configurado no arquivo (ver Task B4)

it('aplica filtro de status ao montar se ?status=scheduled está na URL', () => {
  const setFilters = jest.fn()
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    filtered: () => [],
    cancel: jest.fn(),
    loading: false,
    error: null,
    filters: {},
    setFilters,
  })

  render(
    <MemoryRouter initialEntries={['/jobs?status=scheduled']}>
      <JobListPage />
    </MemoryRouter>
  )

  expect(setFilters).toHaveBeenCalledWith(expect.objectContaining({ status: 'scheduled' }))
})
```

- [ ] **Step B1.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="JobListPage" --watchAll=false
```

Esperado: FAIL

- [ ] **Step B1.2: Atualizar JobListPage para ler query param de status**

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
// ...

export function JobListPage() {
  const [searchParams] = useSearchParams()
  const { load, filtered, cancel, loading, error, filters, setFilters } = useJobStore()
  // ...

  useEffect(() => {
    load()
  }, [load])

  // Sincronizar query param com filtro ao montar
  useEffect(() => {
    const statusParam = searchParams.get('status') as JobStatus | null
    if (statusParam) {
      setFilters({ ...filters, status: statusParam })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // só na montagem
```

- [ ] **Step B1.3: Rodar testes**

```bash
npm test -- --testPathPattern="JobListPage" --watchAll=false
```

Esperado: PASS

- [ ] **Step B1.4: Commit**

```bash
git add src/views/pages/JobListPage.tsx
git commit -m "feat(jobs): read status filter from URL query param"
```

---

### Task B2: Botão "Adicionar" com texto visível em JobListPage

**Contexto:** O botão de novo trabalho exibe apenas `<Plus size={14} />` sem texto. Adicionar o texto "Adicionar".

**Files:**
- Modify: `src/views/pages/JobListPage.tsx`

- [ ] **Step B2.1: Escrever teste que falha — botão com texto "Adicionar"**

Em `src/__tests__/views/JobListPage.test.tsx`, adicionar:

```tsx
it('renderiza link de novo trabalho com texto "Adicionar"', () => {
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(), filtered: () => [], cancel: jest.fn(),
    loading: false, error: null, filters: {}, setFilters: jest.fn(),
  })
  render(<MemoryRouter><JobListPage /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /adicionar/i })).toBeInTheDocument()
})
```

- [ ] **Step B2.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="JobListPage" --watchAll=false
```

Esperado: FAIL — link não tem texto "Adicionar" ainda

- [ ] **Step B2.2: Atualizar o botão**

Localizar em `JobListPage.tsx`:
```tsx
<Link to="/jobs/new" className="btn btn-primary btn-sm" title="Novo trabalho">
  <Plus size={14} />
</Link>
```

Substituir por:
```tsx
<Link to="/jobs/new" className="btn btn-primary btn-sm gap-1">
  <Plus size={14} />
  Adicionar
</Link>
```

- [ ] **Step B2.3: Rodar testes**

```bash
npm test -- --testPathPattern="JobListPage" --watchAll=false
```

Esperado: PASS

- [ ] **Step B2.4: Commit**

```bash
git add src/views/pages/JobListPage.tsx
git commit -m "feat(jobs): add 'Adicionar' label to new job button"
```

---

### Task B3: Ordenar trabalhos por status e depois por data

**Contexto:** O viewmodel `filtered()` retorna os jobs filtrados mas sem ordenação definida. Adicionar ordenação: primeiro por status (scheduled → in_progress → completed → cancelled), depois por `scheduledDate` desc (mais recentes primeiro).

**Files:**
- Modify: `src/viewmodels/job.viewmodel.ts`
- Modify: `src/__tests__/viewmodels/job.viewmodel.test.ts`

- [ ] **Step B3.1: Escrever teste para a ordenação**

Em `src/__tests__/viewmodels/job.viewmodel.test.ts`, adicionar novo describe:

```ts
describe('filtered — ordenação', () => {
  it('ordena por status (scheduled → in_progress → completed → cancelled) e depois por data desc', () => {
    const store = useJobStore.getState()
    store.jobs = [
      { ...baseJob, id: '1', status: 'completed', scheduledDate: '2024-01-10' },
      { ...baseJob, id: '2', status: 'scheduled', scheduledDate: '2024-01-05' },
      { ...baseJob, id: '3', status: 'in_progress', scheduledDate: '2024-01-08' },
      { ...baseJob, id: '4', status: 'scheduled', scheduledDate: '2024-01-15' },
      { ...baseJob, id: '5', status: 'cancelled', scheduledDate: '2024-01-01' },
    ]
    store.filters = {}

    const result = store.filtered()
    expect(result.map((j) => j.id)).toEqual(['4', '2', '3', '1', '5'])
  })
})
```

> **Nota:** Verifique como `baseJob` é definido no arquivo de teste existente e reutilize o mesmo padrão.

- [ ] **Step B3.2: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="job.viewmodel" --watchAll=false
```

Esperado: FAIL

- [ ] **Step B3.3: Implementar ordenação no viewmodel**

Em `src/viewmodels/job.viewmodel.ts`, adicionar antes do `create`:

```ts
const STATUS_ORDER: Record<string, number> = {
  scheduled: 0,
  in_progress: 1,
  completed: 2,
  cancelled: 3,
}
```

Atualizar `filtered()`:

```ts
filtered: () => {
  const { jobs, filters } = get()
  return jobs
    .filter((j) => {
      if (filters.status && j.status !== filters.status) return false
      if (filters.employeeId && j.employeeId !== filters.employeeId) return false
      if (filters.date && j.scheduledDate !== filters.date) return false
      if (filters.jobType && j.jobType !== filters.jobType) return false
      return true
    })
    .sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
      if (statusDiff !== 0) return statusDiff
      return b.scheduledDate.localeCompare(a.scheduledDate)
    })
},
```

- [ ] **Step B3.4: Rodar testes**

```bash
npm test -- --testPathPattern="job.viewmodel" --watchAll=false
```

Esperado: PASS

- [ ] **Step B3.5: Commit**

```bash
git add src/viewmodels/job.viewmodel.ts src/__tests__/viewmodels/job.viewmodel.test.ts
git commit -m "feat(jobs): sort jobs by status then by date descending"
```

---

### Task B4: Substituir navegação 1-click por preview inline na lista

**Contexto:** Atualmente clicar numa linha de trabalho navega para `/jobs/:id`. O comportamento novo: clicar na linha abre um painel de resumo inline (abaixo da row expandida) com dados chave. Dentro desse resumo, um botão "Ver detalhes" navega para a página completa.

**Files:**
- Modify: `src/views/pages/JobListPage.tsx`

- [ ] **Step B4.1: Escrever testes para o comportamento de preview**

Criar ou editar `src/__tests__/views/JobListPage.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { JobListPage } from '@/views/pages/JobListPage'
import { useJobStore } from '@/viewmodels/job.viewmodel'

jest.mock('@/viewmodels/job.viewmodel')

const mockJob = {
  id: 'job-1',
  employeeName: 'Ana Lima',
  machineName: 'Máquina X',
  scheduledDate: '2024-01-15',
  city: 'São Paulo',
  state: 'SP',
  jobType: 'maintenance',
  status: 'scheduled',
  description: 'Manutenção preventiva',
  accommodation: false,
  car: true,
}

beforeEach(() => {
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(),
    filtered: () => [mockJob],
    cancel: jest.fn(),
    loading: false,
    error: null,
    filters: {},
    setFilters: jest.fn(),
  })
})

it('não navega ao clicar na row — exibe preview inline', () => {
  render(<MemoryRouter><JobListPage /></MemoryRouter>)
  fireEvent.click(screen.getByText('Ana Lima'))
  expect(screen.getByTestId('job-preview-job-1')).toBeInTheDocument()
})

it('preview exibe campos chave do trabalho', () => {
  render(<MemoryRouter><JobListPage /></MemoryRouter>)
  fireEvent.click(screen.getByText('Ana Lima'))
  const preview = screen.getByTestId('job-preview-job-1')
  expect(preview).toHaveTextContent('Manutenção preventiva')
  expect(preview).toHaveTextContent('São Paulo/SP')
})

it('preview contém link para a página de detalhes', () => {
  render(<MemoryRouter><JobListPage /></MemoryRouter>)
  fireEvent.click(screen.getByText('Ana Lima'))
  const link = screen.getByRole('link', { name: /ver detalhes/i })
  expect(link).toHaveAttribute('href', '/jobs/job-1')
})

it('clicando novamente na row fecha o preview', () => {
  render(<MemoryRouter><JobListPage /></MemoryRouter>)
  fireEvent.click(screen.getByText('Ana Lima'))
  expect(screen.getByTestId('job-preview-job-1')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Ana Lima'))
  expect(screen.queryByTestId('job-preview-job-1')).not.toBeInTheDocument()
})
```

- [ ] **Step B4.2: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="JobListPage" --watchAll=false
```

Esperado: FAIL

- [ ] **Step B4.3: Implementar preview inline em JobListPage**

Adicionar estado para controlar qual job está expandido. Substituir a navegação por toggle de preview:

```tsx
const [expandedId, setExpandedId] = useState<string | null>(null)

// Na row:
<tr
  key={j.id}
  className="hover cursor-pointer"
  onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}
>
  {/* células existentes */}
</tr>
{expandedId === j.id && (
  <tr key={`preview-${j.id}`}>
    <td colSpan={7} className="bg-base-200 px-4 py-3">
      <div data-testid={`job-preview-${j.id}`} className="flex flex-col gap-1 text-sm">
        <p><span className="font-medium">Descrição:</span> {j.description}</p>
        <p><span className="font-medium">Local:</span> {j.city}/{j.state}</p>
        <p><span className="font-medium">Horário:</span> {j.startTime} – {j.endTime}</p>
        <p><span className="font-medium">Hospedagem:</span> {j.accommodation ? 'Sim' : 'Não'} · <span className="font-medium">Carro:</span> {j.car ? 'Sim' : 'Não'}</p>
        <div className="mt-2 flex gap-2">
          <Link to={`/jobs/${j.id}`} className="btn btn-xs btn-primary">Ver detalhes</Link>
          {j.status !== 'cancelled' && j.status !== 'completed' && (
            <Link to={`/jobs/${j.id}/edit`} className="btn btn-xs btn-ghost" onClick={(e) => e.stopPropagation()}>
              <Pencil size={11} /> Editar
            </Link>
          )}
          {j.status === 'scheduled' && (
            <button className="btn btn-xs btn-ghost text-error" onClick={(e) => { e.stopPropagation(); setCancelId(j.id) }}>
              <Ban size={11} /> Cancelar
            </button>
          )}
        </div>
      </div>
    </td>
  </tr>
)}
```

> **Atenção:** Remover o `onClick={() => navigate(...)}` da row original e remover a coluna "Ações" separada (os botões Editar/Cancelar ficam dentro do preview).

- [ ] **Step B4.4: Rodar testes**

```bash
npm test -- --testPathPattern="JobListPage" --watchAll=false
```

Esperado: PASS

- [ ] **Step B4.5: Commit**

```bash
git add src/views/pages/JobListPage.tsx src/__tests__/views/JobListPage.test.tsx
git commit -m "feat(jobs): replace single-click navigation with inline job preview"
```

---

### Task B5: Formulário de Trabalho — largura 100%, botão voltar, steps clicáveis

**Contexto:** `JobFormPage` tem `max-w-2xl mx-auto` que limita a largura. Remover. O `JobStepper` não permite clicar nos step indicators para navegar. Adicionar botão "Voltar à listagem" na página de cadastro.

**Files:**
- Modify: `src/views/pages/JobFormPage.tsx`
- Modify: `src/views/components/JobStepper.tsx`

- [ ] **Step B5.1: Escrever testes que falham — botão "Voltar à listagem" e largura**

Criar `src/__tests__/views/JobFormPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { JobFormPage } from '@/views/pages/JobFormPage'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'

jest.mock('@/viewmodels/job.viewmodel')
jest.mock('@/viewmodels/machine.viewmodel')
jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/services/job.service', () => ({ fetchJob: jest.fn() }))

beforeEach(() => {
  ;(useJobStore as unknown as jest.Mock).mockReturnValue({ create: jest.fn(), update: jest.fn() })
  ;(useMachineStore as unknown as jest.Mock).mockReturnValue({ machines: [], load: jest.fn() })
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({ employees: [], load: jest.fn() })
})

it('renderiza link "Voltar à listagem" apontando para /jobs', () => {
  render(
    <MemoryRouter initialEntries={['/jobs/new']}>
      <Routes><Route path="/jobs/new" element={<JobFormPage />} /></Routes>
    </MemoryRouter>
  )
  const link = screen.getByRole('link', { name: /voltar/i })
  expect(link).toHaveAttribute('href', '/jobs')
})

it('o wrapper principal não tem classe max-w-2xl', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/jobs/new']}>
      <Routes><Route path="/jobs/new" element={<JobFormPage />} /></Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-2xl')).not.toBeInTheDocument()
})
```

- [ ] **Step B5.1b: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="JobFormPage" --watchAll=false
```

Esperado: FAIL

- [ ] **Step B5.2: Atualizar JobFormPage — remover max-width e adicionar botão voltar**

```tsx
import { Link } from 'react-router-dom'

// No JSX, substituir o wrapper div:
return (
  <div className="p-6">
    <div className="flex items-center gap-3 mb-6">
      <Link to="/jobs" className="btn btn-ghost btn-sm gap-1">
        ← Voltar à listagem
      </Link>
      <h1 className="text-2xl font-bold">{isEditing ? 'Editar Trabalho' : 'Novo Trabalho'}</h1>
    </div>
    <JobStepper
      employees={employeeOptions}
      machines={machineOptions}
      initialData={initialData}
      onSubmit={handleSubmit}
      loading={loading}
    />
  </div>
)
```

- [ ] **Step B5.3: Escrever testes para a navegação por click nos steps do stepper**

Em `src/__tests__/views/JobStepper.test.tsx` (criar se não existir):

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { JobStepper } from '@/views/components/JobStepper'

const employees = [{ id: 'e1', name: 'Maria' }]
const machines = [{ id: 'm1', name: 'Máquina A' }]
const noop = jest.fn()

describe('JobStepper — navegação por click nos steps', () => {
  it('permite clicar em step anterior para voltar (após avançar)', async () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={noop} />)

    // Preencher step 1 e avançar
    fireEvent.change(screen.getByLabelText(/funcionário/i), { target: { value: 'e1' } })
    fireEvent.change(screen.getByLabelText(/data/i), { target: { value: '2024-06-01' } })
    fireEvent.click(screen.getByText('Próximo'))

    // Agora está no step 2 — clicar no indicador do step 1 volta para o step 1
    fireEvent.click(screen.getByTestId('step-indicator-1'))
    expect(screen.getByLabelText(/funcionário/i)).toBeInTheDocument()
  })

  it('não permite clicar em step futuro sem completar o atual', () => {
    render(<JobStepper employees={employees} machines={machines} onSubmit={noop} />)
    // Tenta clicar no step 2 sem preencher o step 1
    fireEvent.click(screen.getByTestId('step-indicator-2'))
    // Ainda deve estar no step 1
    expect(screen.getByLabelText(/funcionário/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step B5.4: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="JobStepper" --watchAll=false
```

- [ ] **Step B5.5: Atualizar StepIndicator em JobStepper.tsx para aceitar cliques**

Extrair `StepIndicator` para aceitar `onStepClick` e `completedUpTo`:

```tsx
function StepIndicator({
  current,
  onStepClick,
}: {
  current: number
  onStepClick: (step: number) => void
}) {
  const steps = ['Funcionário', 'Local', 'Máquina', 'Revisão']
  return (
    <ul className="steps steps-horizontal w-full">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < current
        const isCurrent = stepNum === current
        return (
          <li
            key={label}
            data-testid={`step-indicator-${stepNum}`}
            className={`step ${stepNum <= current ? 'step-primary' : ''} ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => isCompleted && onStepClick(stepNum)}
            role={isCompleted ? 'button' : undefined}
            tabIndex={isCompleted ? 0 : undefined}
            onKeyDown={(e) => isCompleted && e.key === 'Enter' && onStepClick(stepNum)}
          >
            {label}
          </li>
        )
      })}
    </ul>
  )
}
```

Atualizar todos os usos de `<StepIndicator current={N} />` no componente para `<StepIndicator current={step} onStepClick={setStep} />`.

- [ ] **Step B5.6: Rodar todos os testes de formulário**

```bash
npm test -- --testPathPattern="JobStepper|JobFormPage" --watchAll=false
```

Esperado: PASS

- [ ] **Step B5.7: Commit**

```bash
git add src/views/pages/JobFormPage.tsx src/views/components/JobStepper.tsx src/__tests__/views/JobStepper.test.tsx
git commit -m "feat(jobs): full-width form, back button, clickable step indicators"
```

---

### Task B6: Mostrar nomes (não IDs) no step de revisão do Stepper

**Contexto:** O step de revisão (step 4) exibe "Funcionário ID: xxx" e "Máquina ID: xxx". Deve exibir os nomes. O `JobStepper` já recebe `employees` e `machines` com `{ id, name }`.

**Files:**
- Modify: `src/views/components/JobStepper.tsx`

- [ ] **Step B6.1: Escrever teste que falha — nomes exibidos na revisão**

Em `src/__tests__/views/JobStepper.test.tsx`, adicionar:

```tsx
it('exibe nome do funcionário (não ID) no step de revisão', async () => {
  render(
    <JobStepper
      employees={[{ id: 'e1', name: 'Maria Souza' }]}
      machines={[{ id: 'm1', name: 'Inversor A' }]}
      onSubmit={noop}
    />
  )

  // Avançar pelo step 1
  fireEvent.change(screen.getByLabelText(/funcionário/i), { target: { value: 'e1' } })
  fireEvent.change(screen.getByLabelText(/data/i), { target: { value: '2024-06-01' } })
  fireEvent.click(screen.getByText('Próximo'))

  // Avançar pelo step 2 (preencher campos obrigatórios)
  fireEvent.change(screen.getByLabelText(/cidade/i), { target: { value: 'SP' } })
  fireEvent.change(screen.getByLabelText(/estado/i), { target: { value: 'SP' } })
  fireEvent.change(screen.getByLabelText(/início/i), { target: { value: '08:00' } })
  fireEvent.change(screen.getByLabelText(/término/i), { target: { value: '17:00' } })
  fireEvent.click(screen.getByText('Próximo'))

  // Avançar pelo step 3
  fireEvent.change(screen.getByLabelText(/máquina/i), { target: { value: 'm1' } })
  fireEvent.change(screen.getByLabelText(/descrição/i), { target: { value: 'Descricao teste' } })
  fireEvent.click(screen.getByText('Próximo'))

  // Step de revisão — deve mostrar o nome, não o ID
  expect(screen.getByTestId('review-step')).toHaveTextContent('Maria Souza')
  expect(screen.getByTestId('review-step')).toHaveTextContent('Inversor A')
  expect(screen.getByTestId('review-step')).not.toHaveTextContent('e1')
  expect(screen.getByTestId('review-step')).not.toHaveTextContent('m1')
})
```

- [ ] **Step B6.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="JobStepper" --watchAll=false
```

Esperado: FAIL — review ainda exibe IDs

- [ ] **Step B6.2: Atualizar o step de revisão para exibir nomes**

Adicionar helpers no topo do componente `JobStepper`:

```tsx
const employeeName = employees.find((e) => e.id === s1.employeeId)?.name ?? s1.employeeId
const machineName = machines.find((m) => m.id === s3.machineId)?.name ?? s3.machineId
```

Substituir no bloco de revisão:
```tsx
// Antes:
<p><span className="font-medium">Funcionário ID:</span> {s1.employeeId}</p>
// Depois:
<p><span className="font-medium">Funcionário:</span> {employeeName}</p>

// Antes:
<p><span className="font-medium">Máquina ID:</span> {s3.machineId}</p>
// Depois:
<p><span className="font-medium">Máquina:</span> {machineName}</p>
```

- [ ] **Step B6.3: Rodar testes**

```bash
npm test -- --testPathPattern="JobStepper" --watchAll=false
```

Esperado: PASS

- [ ] **Step B6.4: Commit**

```bash
git add src/views/components/JobStepper.tsx
git commit -m "feat(jobs): show employee and machine names instead of IDs in review step"
```

---

### Task B7: ManagerJobDetailPage — visualização completa em modo read-only

**Contexto:** A página de detalhe do trabalho (`/jobs/:id`) exibe dados num grid simples. O pedido é mostrar o formulário completo em modo de visualização (todos os campos visíveis de uma vez, sem stepper). Criar um componente `JobReadOnlyView` para isso.

**Files:**
- Create: `src/views/components/JobReadOnlyView.tsx`
- Create: `src/__tests__/views/JobReadOnlyView.test.tsx`
- Modify: `src/views/pages/ManagerJobDetailPage.tsx`

- [ ] **Step B7.1: Escrever testes para JobReadOnlyView**

```tsx
// src/__tests__/views/JobReadOnlyView.test.tsx
import { render, screen } from '@testing-library/react'
import { JobReadOnlyView } from '@/views/components/JobReadOnlyView'
import type { JobDetail } from '@/models/job.model'

const job: JobDetail = {
  id: 'j1',
  employeeId: 'e1',
  employeeName: 'Carlos Silva',
  machineId: 'm1',
  machineName: 'Inversor Solar X',
  jobType: 'maintenance',
  status: 'completed',
  description: 'Revisão geral do sistema',
  scheduledDate: '2024-03-10',
  city: 'Campinas',
  state: 'SP',
  accommodation: true,
  car: false,
  startTime: '08:00',
  endTime: '17:00',
  notes: 'Levar ferramenta específica',
  createdAt: '2024-03-01',
  updatedAt: '2024-03-10',
  machine: { name: 'Inversor Solar X' },
}

it('exibe nome do funcionário', () => {
  render(<JobReadOnlyView job={job} />)
  expect(screen.getByText('Carlos Silva')).toBeInTheDocument()
})

it('exibe nome da máquina', () => {
  render(<JobReadOnlyView job={job} />)
  expect(screen.getByText('Inversor Solar X')).toBeInTheDocument()
})

it('exibe todos os campos do formulário', () => {
  render(<JobReadOnlyView job={job} />)
  expect(screen.getByText(/revisão geral do sistema/i)).toBeInTheDocument()
  expect(screen.getByText(/campinas/i)).toBeInTheDocument()
  expect(screen.getByText(/levar ferramenta/i)).toBeInTheDocument()
})

it('exibe status formatado em português', () => {
  render(<JobReadOnlyView job={job} />)
  expect(screen.getByText('Concluído')).toBeInTheDocument()
})
```

- [ ] **Step B7.2: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="JobReadOnlyView" --watchAll=false
```

- [ ] **Step B7.3: Criar JobReadOnlyView.tsx**

```tsx
// src/views/components/JobReadOnlyView.tsx
import type { JobDetail } from '@/models/job.model'
import { formatDate } from '@/utils/date'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_CLASS: Record<string, string> = {
  scheduled: 'badge-warning',
  in_progress: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
}

interface Props { job: JobDetail }

export function JobReadOnlyView({ job }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Seção 1: Funcionário e Data */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-3">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Funcionário e Data</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Funcionário:</span><span>{job.employeeName}</span>
            <span className="font-medium">Data:</span><span>{formatDate(job.scheduledDate)}</span>
          </div>
        </div>
      </div>

      {/* Seção 2: Local e Horários */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-3">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Local e Horários</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Cidade:</span><span>{job.city}</span>
            <span className="font-medium">Estado:</span><span>{job.state}</span>
            <span className="font-medium">Início:</span><span>{job.startTime}</span>
            <span className="font-medium">Término:</span><span>{job.endTime}</span>
            <span className="font-medium">Hospedagem:</span><span>{job.accommodation ? 'Sim' : 'Não'}</span>
            <span className="font-medium">Carro:</span><span>{job.car ? 'Sim' : 'Não'}</span>
          </div>
        </div>
      </div>

      {/* Seção 3: Máquina e Trabalho */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body gap-3">
          <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Máquina e Trabalho</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Máquina:</span><span>{job.machineName}</span>
            <span className="font-medium">Tipo:</span>
            <span>{job.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</span>
            <span className="font-medium">Status:</span>
            <span>
              <span className={`badge badge-sm ${STATUS_CLASS[job.status] ?? 'badge-ghost'}`}>
                {STATUS_LABEL[job.status] ?? job.status}
              </span>
            </span>
          </div>
          <div className="text-sm mt-1">
            <p className="font-medium mb-1">Descrição:</p>
            <p className="text-base-content/70">{job.description}</p>
          </div>
          {job.notes && (
            <div className="text-sm">
              <p className="font-medium mb-1">Observações:</p>
              <p className="text-base-content/70">{job.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step B7.4: Atualizar ManagerJobDetailPage para usar JobReadOnlyView na aba de informações**

No `tab === 'info'`, substituir o grid simples por:
```tsx
{tab === 'info' && <JobReadOnlyView job={job} />}
```

Adicionar import: `import { JobReadOnlyView } from '@/views/components/JobReadOnlyView'`

- [ ] **Step B7.5: Rodar todos os testes de jobs**

```bash
npm test -- --testPathPattern="job|Job" --watchAll=false
```

Esperado: PASS

- [ ] **Step B7.6: Commit**

```bash
git add src/views/components/JobReadOnlyView.tsx src/__tests__/views/JobReadOnlyView.test.tsx src/views/pages/ManagerJobDetailPage.tsx
git commit -m "feat(jobs): read-only view for job detail with full form layout"
```

---

## SEÇÃO C — Máquinas (Machines)

### Task C1: Formulário de máquina — largura 100%

**Contexto:** `MachineFormPage` tem `max-w-lg mx-auto` limitando a largura. Remover.

**Files:**
- Modify: `src/views/pages/MachineFormPage.tsx`

> **Nota sobre CSS:** Remoção de classes Tailwind (`max-w-lg`) não pode ser verificada por testes de comportamento com Testing Library (que não calcula estilos computados). O teste abaixo usa uma assertion de ausência de classe no DOM como guarda de regressão.

- [ ] **Step C1.1: Escrever teste que falha — wrapper sem max-w-lg**

Criar `src/__tests__/views/MachineFormPage.test.tsx` (se não existir):

```tsx
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MachineFormPage } from '@/views/pages/MachineFormPage'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'

jest.mock('@/viewmodels/machine.viewmodel')
jest.mock('@/services/machine.service', () => ({ fetchMachine: jest.fn(), fetchMachineJobs: jest.fn() }))

beforeEach(() => {
  ;(useMachineStore as unknown as jest.Mock).mockReturnValue({ create: jest.fn(), update: jest.fn(), uploadManual: jest.fn() })
})

it('o wrapper principal não contém classe max-w-lg', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/machines/new']}>
      <Routes><Route path="/machines/new" element={<MachineFormPage />} /></Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-lg')).not.toBeInTheDocument()
})
```

- [ ] **Step C1.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="MachineFormPage" --watchAll=false
```

Esperado: FAIL

- [ ] **Step C1.2: Remover max-width do MachineFormPage**

Localizar:
```tsx
<div className="max-w-lg mx-auto">
```

Substituir por:
```tsx
<div>
```

Adicionalmente, verificar se `MachineForm.tsx` tem max-width próprio e remover se houver.

- [ ] **Step C1.3: Rodar testes**

```bash
npm test -- --testPathPattern="MachineFormPage" --watchAll=false
```

Esperado: PASS

- [ ] **Step C1.4: Commit**

```bash
git add src/views/pages/MachineFormPage.tsx
git commit -m "feat(machines): remove max-width constraint from machine form"
```

---

### Task C2: Aba de Empresas em MachineFormPage

**Contexto:** Adicionar uma aba "Empresas" que mostra todas as empresas que possuem/utilizam esta máquina.

> **Pré-requisito:** Consulte `FRONTEND_API_DOCS.md` para verificar o contrato do endpoint de empresas da máquina (`fetchMachineCompanies`). Se o endpoint não existir, sinalizar ao backend antes de prosseguir.

**Files:**
- Modify: `src/models/machine.model.ts`
- Modify: `src/services/machine.service.ts`
- Create: `src/views/components/MachineCompanies.tsx`
- Create: `src/__tests__/views/MachineCompanies.test.tsx`
- Modify: `src/views/pages/MachineFormPage.tsx`

- [ ] **Step C2.0: BLOQUEANTE — Verificar contrato do endpoint de empresas**

Abrir `FRONTEND_API_DOCS.md` e procurar pelo endpoint de empresas da máquina.

```bash
grep -i "compan\|machine_compan\|machine.*compan" FRONTEND_API_DOCS.md
```

**Se o endpoint NÃO existir:** Reportar ao backend e não prosseguir com este task até o contrato estar documentado. A interface `MachineCompany` e a query Supabase abaixo devem ser ajustadas conforme o contrato real.

**Se existir:** Anotar o nome da tabela/view, campos disponíveis, e ajustar os passos C2.2 e C2.5 de acordo.

- [ ] **Step C2.1: Adicionar interface MachineCompany ao modelo**

> Esta é apenas uma declaração de tipo — necessária antes dos testes porque os testes importam este tipo.

Em `src/models/machine.model.ts`, adicionar ao final:

```ts
export interface MachineCompany {
  id: string
  name: string
  contractId?: string
}
```

- [ ] **Step C2.2: Escrever testes para MachineCompanies (falham — componente ainda não existe)**

```tsx
// src/__tests__/views/MachineCompanies.test.tsx
import { render, screen } from '@testing-library/react'
import { MachineCompanies } from '@/views/components/MachineCompanies'
import type { MachineCompany } from '@/models/machine.model'

const companies: MachineCompany[] = [
  { id: 'c1', name: 'SR Energy Ltda' },
  { id: 'c2', name: 'Solar Corp' },
]

it('exibe lista de empresas', () => {
  render(<MachineCompanies companies={companies} loading={false} />)
  expect(screen.getByText('SR Energy Ltda')).toBeInTheDocument()
  expect(screen.getByText('Solar Corp')).toBeInTheDocument()
})

it('exibe loading spinner', () => {
  render(<MachineCompanies companies={[]} loading={true} />)
  expect(document.querySelector('.loading')).toBeInTheDocument()
})

it('exibe mensagem quando não há empresas', () => {
  render(<MachineCompanies companies={[]} loading={false} />)
  expect(screen.getByText(/nenhuma empresa/i)).toBeInTheDocument()
})
```

- [ ] **Step C2.2b: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="MachineCompanies" --watchAll=false
```

Esperado: FAIL — `MachineCompanies` não existe ainda

- [ ] **Step C2.3: Adicionar fetchMachineCompanies ao serviço**

Em `src/services/machine.service.ts`, adicionar:

```ts
export async function fetchMachineCompanies(machineId: string): Promise<MachineCompany[]> {
  const { data, error } = await supabase
    .from('machine_companies')        // ajustar nome da tabela conforme FRONTEND_API_DOCS.md
    .select('id, name, contract_id')
    .eq('machine_id', machineId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    contractId: row.contract_id,
  }))
}
```

> **Nota:** Ajuste a query de acordo com o contrato real em `FRONTEND_API_DOCS.md`.

- [ ] **Step C2.5: Criar MachineCompanies.tsx**

```tsx
// src/views/components/MachineCompanies.tsx
import { Building2 } from 'lucide-react'
import type { MachineCompany } from '@/models/machine.model'

interface Props {
  companies: MachineCompany[]
  loading: boolean
}

export function MachineCompanies({ companies, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-base-300 rounded-lg" />
        ))}
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <p className="text-sm text-base-content/40 py-8 text-center">
        Nenhuma empresa vinculada a esta máquina.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {companies.map((company) => (
        <div key={company.id} className="flex items-center gap-3 p-3 rounded-lg bg-base-200 border border-base-300">
          <Building2 size={16} className="text-base-content/40 shrink-0" />
          <span className="text-sm font-medium">{company.name}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step C2.6: Atualizar MachineFormPage — adicionar aba Empresas e integrar serviço**

```tsx
type Tab = 'details' | 'history' | 'companies'

// Adicionar estado:
const [companies, setCompanies] = useState<MachineCompany[]>([])
const [companiesLoading, setCompaniesLoading] = useState(false)

// Adicionar useEffect:
useEffect(() => {
  if (!isEditing || !id || activeTab !== 'companies') return
  setCompaniesLoading(true)
  fetchMachineCompanies(id)
    .then(setCompanies)
    .finally(() => setCompaniesLoading(false))
}, [id, isEditing, activeTab])

// Adicionar aba no tablist:
<button role="tab" className={`tab ${activeTab === 'companies' ? 'tab-active' : ''}`} onClick={() => setActiveTab('companies')}>
  Empresas
</button>

// Adicionar conteúdo:
{activeTab === 'companies' && <MachineCompanies companies={companies} loading={companiesLoading} />}
```

Adicionar imports: `fetchMachineCompanies`, `MachineCompany`, `MachineCompanies`

- [ ] **Step C2.7: Rodar todos os testes de máquinas**

```bash
npm test -- --testPathPattern="Machine|machine" --watchAll=false
```

Esperado: PASS

- [ ] **Step C2.8: Commit**

```bash
git add src/models/machine.model.ts src/services/machine.service.ts src/views/components/MachineCompanies.tsx src/__tests__/views/MachineCompanies.test.tsx src/views/pages/MachineFormPage.tsx
git commit -m "feat(machines): add companies tab showing linked companies"
```

---

### Task C3: Histórico de trabalhos da máquina — clicar navega para detalhe

**Contexto:** `MachineJobHistory` renderiza rows de trabalhos sem interatividade. Ao clicar numa row, deve navegar para `/jobs/:id`.

**Files:**
- Modify: `src/views/components/MachineJobHistory.tsx`
- Modify: `src/__tests__/views/MachineJobHistory.test.tsx`

- [ ] **Step C3.1: Escrever testes para a navegação ao clicar**

Em `src/__tests__/views/MachineJobHistory.test.tsx`, adicionar:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { MachineJobHistory } from '@/views/components/MachineJobHistory'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

const jobs = [
  {
    id: 'job-42',
    employeeName: 'Pedro Costa',
    scheduledDate: '2024-02-10',
    city: 'Bauru',
    state: 'SP',
    jobType: 'maintenance' as const,
    status: 'completed',
  },
]

it('navega para /jobs/:id ao clicar na row', () => {
  const navigate = jest.fn()
  ;(useNavigate as jest.Mock).mockReturnValue(navigate)

  render(
    <MemoryRouter>
      <MachineJobHistory jobs={jobs} loading={false} />
    </MemoryRouter>
  )

  fireEvent.click(screen.getByText('Pedro Costa'))
  expect(navigate).toHaveBeenCalledWith('/jobs/job-42')
})
```

- [ ] **Step C3.2: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="MachineJobHistory" --watchAll=false
```

- [ ] **Step C3.3: Atualizar MachineJobHistory para navegar ao clicar**

```tsx
import { useNavigate } from 'react-router-dom'

export function MachineJobHistory({ jobs, loading }: Props) {
  const navigate = useNavigate()
  // ...

  // Na row:
  <tr
    key={job.id}
    className="border-base-300 hover:bg-base-300/30 transition-colors cursor-pointer"
    onClick={() => navigate(`/jobs/${job.id}`)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs/${job.id}`)}
  >
```

- [ ] **Step C3.4: Rodar todos os testes**

```bash
npm test --watchAll=false
```

Esperado: PASS em todos os testes

- [ ] **Step C3.5: Commit**

```bash
git add src/views/components/MachineJobHistory.tsx src/__tests__/views/MachineJobHistory.test.tsx
git commit -m "feat(machines): navigate to job detail on history row click"
```

---

## SEÇÃO D — Contratos

### Task D1: Formulário de contrato — largura 100%

**Contexto:** `ContractFormPage` tem `max-w-xl mx-auto` no wrapper principal e no skeleton de loading. Remover.

**Files:**
- Modify: `src/views/pages/ContractFormPage.tsx`

- [ ] **Step D1.1: Escrever teste que falha — sem max-w-xl**

Criar `src/__tests__/views/ContractFormPage.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ContractFormPage } from '@/views/pages/ContractFormPage'
import { useContractStore } from '@/viewmodels/contract.viewmodel'

jest.mock('@/viewmodels/contract.viewmodel')
jest.mock('@/services/contract.service', () => ({ fetchContract: jest.fn(), uploadContractFile: jest.fn() }))

beforeEach(() => {
  ;(useContractStore as unknown as jest.Mock).mockReturnValue({ create: jest.fn(), update: jest.fn() })
})

it('o wrapper principal não contém classe max-w-xl', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/contracts/new']}>
      <Routes><Route path="/contracts/new" element={<ContractFormPage />} /></Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-xl')).not.toBeInTheDocument()
})
```

- [ ] **Step D1.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="ContractFormPage" --watchAll=false
```

- [ ] **Step D1.2: Remover max-width de ContractFormPage**

Localizar em `src/views/pages/ContractFormPage.tsx`:
```tsx
<div className="p-6 max-w-xl mx-auto">
```
Substituir por:
```tsx
<div className="p-6">
```
Também remover `max-w-xl` do skeleton de loading na linha `animate-pulse max-w-xl` (dentro do `EmployeeFormPage` não — isso é ContractFormPage; verificar se existe skeleton similar).

- [ ] **Step D1.3: Rodar testes**

```bash
npm test -- --testPathPattern="ContractFormPage" --watchAll=false
```

- [ ] **Step D1.4: Commit**

```bash
git add src/views/pages/ContractFormPage.tsx src/__tests__/views/ContractFormPage.test.tsx
git commit -m "feat(contracts): remove max-width constraint from contract form"
```

---

### Task D2: Campo "recorrente" no contrato

**Contexto:** `Contract` não tem campo `recurring`. Adicionar como `boolean` no modelo, schema, formulário e listagem.

**Files:**
- Modify: `src/models/contract.model.ts`
- Modify: `src/views/components/ContractForm.tsx`
- Modify: `src/views/pages/ContractFormPage.tsx`
- Modify: `src/views/pages/ContractListPage.tsx`

- [ ] **Step D2.1: Escrever testes que falham**

Em `src/__tests__/views/ContractForm.test.tsx` (criar se não existir):

```tsx
import { render, screen } from '@testing-library/react'
import { ContractForm } from '@/views/components/ContractForm'

it('renderiza select de recorrência com opções Sim/Não', () => {
  render(<ContractForm onSubmit={jest.fn()} />)
  expect(screen.getByLabelText(/recorrente/i)).toBeInTheDocument()
  expect(screen.getByRole('option', { name: /não recorrente/i })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: /recorrente/i })).toBeInTheDocument()
})

it('select de recorrência tem valor padrão "false" (Não recorrente)', () => {
  render(<ContractForm onSubmit={jest.fn()} />)
  const select = screen.getByLabelText(/recorrente/i) as HTMLSelectElement
  expect(select.value).toBe('false')
})
```

- [ ] **Step D2.1b: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="ContractForm" --watchAll=false
```

- [ ] **Step D2.2: Adicionar `recurring` ao modelo e schema**

Em `src/models/contract.model.ts`:

```ts
export interface Contract {
  // ... campos existentes ...
  recurring: boolean   // adicionar
}

export const contractSchema = z.object({
  // ... campos existentes ...
  recurring: z.boolean().default(false),   // adicionar
})
```

- [ ] **Step D2.3: Adicionar select de recorrência ao ContractForm**

Em `src/views/components/ContractForm.tsx`, adicionar no `useState` inicial:
```tsx
recurring: initialData?.recurring ?? false,
```

Adicionar fieldset após o campo `endDate`:
```tsx
<fieldset className="fieldset gap-1">
  <label className="label text-xs font-medium text-base-content/60" htmlFor="recurring">
    Recorrente
  </label>
  <select
    id="recurring"
    className="select select-bordered w-full"
    value={String(form.recurring)}
    onChange={(e) => set_('recurring', e.target.value)}
  >
    <option value="false">Não recorrente</option>
    <option value="true">Recorrente</option>
  </select>
</fieldset>
```

> **Nota:** O estado do form usa strings; converter para boolean antes do `safeParse`: `recurring: form.recurring === 'true'`.

- [ ] **Step D2.4: Atualizar ContractFormPage para mapear `recurring` ao carregar**

```tsx
setInitialData({
  // ... campos existentes ...
  recurring: c.recurring,
})
```

- [ ] **Step D2.5: Mostrar coluna "Recorrente" na ContractListPage**

Adicionar `<th>Recorrente</th>` no thead e nas células:
```tsx
<td>
  {c.recurring
    ? <span className="badge badge-sm badge-info">Recorrente</span>
    : <span className="text-base-content/30 text-xs">—</span>
  }
</td>
```

- [ ] **Step D2.6: Rodar testes**

```bash
npm test -- --testPathPattern="Contract" --watchAll=false
```

- [ ] **Step D2.7: Commit**

```bash
git add src/models/contract.model.ts src/views/components/ContractForm.tsx src/views/pages/ContractFormPage.tsx src/views/pages/ContractListPage.tsx src/__tests__/views/ContractForm.test.tsx
git commit -m "feat(contracts): add recurring field to contract model and form"
```

---

### Task D3: Botão "Encerrar contrato"

**Contexto:** Adicionar ação de encerramento que define `endDate = hoje`, exibindo o contrato como `expired`. Visível apenas para contratos `active` ou `expiring`.

**Files:**
- Modify: `src/services/contract.service.ts`
- Modify: `src/viewmodels/contract.viewmodel.ts`
- Modify: `src/views/pages/ContractListPage.tsx`

- [ ] **Step D3.1: Escrever testes que falham**

Criar `src/__tests__/viewmodels/contract.viewmodel.test.ts` (se não existir):

```ts
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import * as contractService from '@/services/contract.service'

jest.mock('@/services/contract.service')

const activeContract = {
  id: 'c1', clientName: 'ACME', clientCnpj: '11.111.111/0001-11',
  description: 'Contrato ativo', startDate: '2024-01-01',
  endDate: '2099-12-31', recurring: false,
  createdAt: '2024-01-01', updatedAt: '2024-01-01',
}

it('terminate chama updateContract com endDate = hoje e atualiza o store', async () => {
  const today = new Date().toISOString().split('T')[0]
  const terminated = { ...activeContract, endDate: today }
  ;(contractService.updateContract as jest.Mock).mockResolvedValue(terminated)

  useContractStore.setState({ contracts: [activeContract] })
  await useContractStore.getState().terminate('c1')

  expect(contractService.updateContract).toHaveBeenCalledWith('c1', expect.objectContaining({ endDate: today }))
  expect(useContractStore.getState().contracts[0].endDate).toBe(today)
})
```

- [ ] **Step D3.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="contract.viewmodel" --watchAll=false
```

- [ ] **Step D3.2: Adicionar `terminate` ao viewmodel**

Em `src/viewmodels/contract.viewmodel.ts`, adicionar à interface e implementação:

```ts
terminate: (id: string) => Promise<void>

// implementação:
terminate: async (id) => {
  const today = new Date().toISOString().split('T')[0]
  const updated = await updateContract(id, { endDate: today })
  set((s) => ({
    contracts: s.contracts.map((c) => (c.id === id ? updated : c)),
  }))
},
```

- [ ] **Step D3.3: Adicionar botão "Encerrar" na ContractListPage**

```tsx
// No estado:
const [terminateId, setTerminateId] = useState<string | null>(null)

// Desestruturar `terminate` do store
const { load, contracts, remove, terminate, loading, error } = useContractStore()

// Na coluna de ações (somente para active/expiring):
{['active', 'expiring'].includes(getContractStatus(c.endDate)) && (
  <button
    className="btn btn-ghost btn-xs text-warning"
    onClick={(e) => { e.stopPropagation(); setTerminateId(c.id) }}
    title="Encerrar contrato"
  >
    <XCircle size={13} />
  </button>
)}

// Modal de confirmação:
{terminateId && (
  <div className="modal modal-open">
    <div className="modal-box">
      <h3 className="font-bold text-lg">Encerrar contrato</h3>
      <p className="py-4">Esta ação definirá a data de término como hoje. Confirmar?</p>
      <div className="modal-action">
        <button className="btn btn-ghost" onClick={() => setTerminateId(null)}>Cancelar</button>
        <button className="btn btn-warning" onClick={async () => { await terminate(terminateId); setTerminateId(null) }}>
          Encerrar
        </button>
      </div>
    </div>
  </div>
)}
```

Adicionar import: `import { XCircle } from 'lucide-react'`

- [ ] **Step D3.4: Rodar testes**

```bash
npm test -- --testPathPattern="Contract|contract" --watchAll=false
```

- [ ] **Step D3.5: Commit**

```bash
git add src/viewmodels/contract.viewmodel.ts src/views/pages/ContractListPage.tsx src/__tests__/viewmodels/contract.viewmodel.test.ts
git commit -m "feat(contracts): add terminate contract action and button"
```

---

### Task D4: Filtros e ordenação na listagem de contratos

**Contexto:** `ContractListPage` não tem filtros nem ordenação. Adicionar: busca por cliente, filtro de status, filtro de recorrência, e ordenação por data de término.

**Files:**
- Modify: `src/viewmodels/contract.viewmodel.ts`
- Modify: `src/views/pages/ContractListPage.tsx`
- Modify: `src/__tests__/viewmodels/contract.viewmodel.test.ts`

- [ ] **Step D4.1: Escrever testes que falham — filtered() com busca, status e sort**

Em `src/__tests__/viewmodels/contract.viewmodel.test.ts`, adicionar:

```ts
const contracts = [
  { ...activeContract, id: '1', clientName: 'Alfa', endDate: '2026-06-01', recurring: false },
  { ...activeContract, id: '2', clientName: 'Beta', endDate: '2024-01-01', recurring: true },
  { ...activeContract, id: '3', clientName: 'Gama', endDate: '2099-01-01', recurring: false },
]

describe('filtered', () => {
  beforeEach(() => useContractStore.setState({ contracts, search: '', statusFilter: undefined, sortField: 'endDate', sortOrder: 'asc' }))

  it('filtra por busca de cliente', () => {
    useContractStore.getState().setSearch('alfa')
    const result = useContractStore.getState().filtered()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('ordena por endDate asc por padrão', () => {
    const result = useContractStore.getState().filtered()
    expect(result.map((c) => c.id)).toEqual(['2', '1', '3'])
  })
})
```

- [ ] **Step D4.1b: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="contract.viewmodel" --watchAll=false
```

- [ ] **Step D4.2: Atualizar contract.viewmodel com search, statusFilter, sort e filtered()**

```ts
interface ContractState {
  // ... existentes ...
  search: string
  statusFilter: ContractStatus | undefined
  recurringFilter: boolean | undefined
  sortField: 'endDate' | 'clientName' | 'startDate'
  sortOrder: 'asc' | 'desc'

  setSearch: (q: string) => void
  setStatusFilter: (s: ContractStatus | undefined) => void
  setRecurringFilter: (r: boolean | undefined) => void
  setSort: (field: 'endDate' | 'clientName' | 'startDate', order: 'asc' | 'desc') => void
  filtered: () => Contract[]
}

// Estado inicial:
search: '',
statusFilter: undefined,
recurringFilter: undefined,
sortField: 'endDate',
sortOrder: 'asc',

// Implementações:
setSearch: (q) => set({ search: q }),
setStatusFilter: (s) => set({ statusFilter: s }),
setRecurringFilter: (r) => set({ recurringFilter: r }),
setSort: (sortField, sortOrder) => set({ sortField, sortOrder }),

filtered: () => {
  const { contracts, search, statusFilter, recurringFilter, sortField, sortOrder } = get()
  const q = search.toLowerCase()
  return [...contracts]
    .filter((c) => {
      if (q && !c.clientName.toLowerCase().includes(q) && !c.clientCnpj.includes(q)) return false
      if (statusFilter && getContractStatus(c.endDate) !== statusFilter) return false
      if (recurringFilter !== undefined && c.recurring !== recurringFilter) return false
      return true
    })
    .sort((a, b) => {
      const valA = sortField === 'clientName' ? a.clientName : a[sortField]
      const valB = sortField === 'clientName' ? b.clientName : b[sortField]
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0
      return sortOrder === 'asc' ? cmp : -cmp
    })
},
```

Adicionar import: `import { getContractStatus } from '@/models/contract.model'` (e `ContractStatus`)

- [ ] **Step D4.3: Adicionar controles de filtro e ordenação na ContractListPage**

```tsx
// Substituir o uso direto de `contracts` por `filtered()`:
const { load, filtered, remove, terminate, loading, error, search, setSearch, statusFilter, setStatusFilter, recurringFilter, setRecurringFilter, sortField, sortOrder, setSort } = useContractStore()
const contracts = filtered()

// Adicionar barra de filtros antes da tabela:
<div className="flex flex-wrap gap-3 mb-4">
  <input
    type="text"
    className="input input-bordered input-sm"
    placeholder="Buscar por cliente ou CNPJ..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  <select
    className="select select-bordered select-sm"
    value={statusFilter ?? ''}
    onChange={(e) => setStatusFilter((e.target.value as ContractStatus) || undefined)}
  >
    <option value="">Todos os status</option>
    <option value="active">Ativo</option>
    <option value="expiring">Vencendo</option>
    <option value="expired">Expirado</option>
  </select>
  <select
    className="select select-bordered select-sm"
    value={recurringFilter === undefined ? '' : String(recurringFilter)}
    onChange={(e) => setRecurringFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
  >
    <option value="">Todos</option>
    <option value="true">Recorrentes</option>
    <option value="false">Não recorrentes</option>
  </select>
  <select
    className="select select-bordered select-sm"
    value={`${sortField}-${sortOrder}`}
    onChange={(e) => {
      const [f, o] = e.target.value.split('-') as [typeof sortField, typeof sortOrder]
      setSort(f, o)
    }}
  >
    <option value="endDate-asc">Vencimento ↑</option>
    <option value="endDate-desc">Vencimento ↓</option>
    <option value="clientName-asc">Cliente A→Z</option>
    <option value="clientName-desc">Cliente Z→A</option>
    <option value="startDate-asc">Início ↑</option>
    <option value="startDate-desc">Início ↓</option>
  </select>
</div>
```

Também trocar `{paginated.map(...)` para usar `usePagination(contracts, 10)` com a lista filtrada/ordenada.

- [ ] **Step D4.4: Rodar testes**

```bash
npm test -- --testPathPattern="Contract|contract" --watchAll=false
```

- [ ] **Step D4.5: Commit**

```bash
git add src/viewmodels/contract.viewmodel.ts src/views/pages/ContractListPage.tsx src/__tests__/viewmodels/contract.viewmodel.test.ts
git commit -m "feat(contracts): add search, status filter, recurring filter and sort to contract list"
```

---

## SEÇÃO E — Funcionários

### Task E1: Formulário de funcionário — largura 100%

**Contexto:** `EmployeeFormPage` tem `max-w-xl` no wrapper principal e no skeleton.

**Files:**
- Modify: `src/views/pages/EmployeeFormPage.tsx`

- [ ] **Step E1.1: Escrever teste que falha**

Criar `src/__tests__/views/EmployeeFormPage.test.tsx` (se não existir):

```tsx
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EmployeeFormPage } from '@/views/pages/EmployeeFormPage'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'

jest.mock('@/viewmodels/employee.viewmodel')
jest.mock('@/services/employee.service', () => ({ fetchEmployee: jest.fn(), fetchSalaryAdjustments: jest.fn().mockResolvedValue([]) }))

beforeEach(() => {
  ;(useEmployeeStore as unknown as jest.Mock).mockReturnValue({
    create: jest.fn(), update: jest.fn(), loading: false,
    adjustments: [], adjustmentsLoading: false,
    loadAdjustments: jest.fn().mockResolvedValue(undefined),
    addAdjustment: jest.fn(),
  })
})

it('o wrapper principal não contém classe max-w-xl', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/employees/new']}>
      <Routes><Route path="/employees/new" element={<EmployeeFormPage />} /></Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-xl')).not.toBeInTheDocument()
})
```

- [ ] **Step E1.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="EmployeeFormPage" --watchAll=false
```

- [ ] **Step E1.2: Remover max-width de EmployeeFormPage**

Localizar em `src/views/pages/EmployeeFormPage.tsx`:
```tsx
<div className="flex flex-col gap-6 max-w-xl">
```
Substituir por:
```tsx
<div className="flex flex-col gap-6">
```
Também remover `max-w-xl` do skeleton:
```tsx
// Antes:
<div className="flex flex-col gap-4 animate-pulse max-w-xl">
// Depois:
<div className="flex flex-col gap-4 animate-pulse">
```

- [ ] **Step E1.3: Rodar testes**

```bash
npm test -- --testPathPattern="EmployeeFormPage" --watchAll=false
```

- [ ] **Step E1.4: Commit**

```bash
git add src/views/pages/EmployeeFormPage.tsx src/__tests__/views/EmployeeFormPage.test.tsx
git commit -m "feat(employees): remove max-width constraint from employee form"
```

---

### Task E2: Filtros e ordenação na listagem de funcionários

**Contexto:** `EmployeeListPage` tem busca por texto mas sem filtro de função nem ordenação.

**Files:**
- Modify: `src/viewmodels/employee.viewmodel.ts`
- Modify: `src/views/pages/EmployeeListPage.tsx`
- Modify: `src/__tests__/viewmodels/employee.viewmodel.test.ts`

- [ ] **Step E2.1: Escrever testes que falham — roleFilter e sort**

Em `src/__tests__/viewmodels/employee.viewmodel.test.ts`, adicionar:

```ts
const employees = [
  { id: '1', name: 'Zuleica', email: 'z@x.com', role: 'manager', salary: 8000, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Ana', email: 'a@x.com', role: 'employee', salary: 4000, createdAt: '', updatedAt: '' },
  { id: '3', name: 'Carlos', email: 'c@x.com', role: 'employee', salary: 5000, createdAt: '', updatedAt: '' },
]

describe('filtered — roleFilter e sort', () => {
  beforeEach(() => useEmployeeStore.setState({ employees, search: '', roleFilter: undefined, sortField: 'name', sortOrder: 'asc' }))

  it('filtra por role=employee', () => {
    useEmployeeStore.getState().setRoleFilter('employee')
    const result = useEmployeeStore.getState().filtered()
    expect(result.every((e) => e.role === 'employee')).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('ordena por salary desc', () => {
    useEmployeeStore.getState().setSort('salary', 'desc')
    const result = useEmployeeStore.getState().filtered()
    expect(result[0].salary).toBeGreaterThanOrEqual(result[1].salary)
  })

  it('ordena por name asc por padrão', () => {
    const result = useEmployeeStore.getState().filtered()
    expect(result[0].name).toBe('Ana')
  })
})
```

- [ ] **Step E2.1b: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="employee.viewmodel" --watchAll=false
```

- [ ] **Step E2.2: Atualizar employee.viewmodel com roleFilter, sort e updated filtered()**

Adicionar ao estado:
```ts
roleFilter: 'manager' | 'employee' | undefined
sortField: 'name' | 'salary'
sortOrder: 'asc' | 'desc'

setRoleFilter: (r: 'manager' | 'employee' | undefined) => void
setSort: (field: 'name' | 'salary', order: 'asc' | 'desc') => void
```

Estado inicial:
```ts
roleFilter: undefined,
sortField: 'name',
sortOrder: 'asc',
```

Ações:
```ts
setRoleFilter: (r) => set({ roleFilter: r }),
setSort: (sortField, sortOrder) => set({ sortField, sortOrder }),
```

Atualizar `filtered()`:
```ts
filtered: () => {
  const { employees, search, roleFilter, sortField, sortOrder } = get()
  const q = search.toLowerCase()
  return [...employees]
    .filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false
      if (roleFilter && e.role !== roleFilter) return false
      return true
    })
    .sort((a, b) => {
      const cmp = sortField === 'name'
        ? a.name.localeCompare(b.name)
        : a.salary - b.salary
      return sortOrder === 'asc' ? cmp : -cmp
    })
},
```

- [ ] **Step E2.3: Adicionar controles de filtro e ordenação na EmployeeListPage**

```tsx
const { loading, error, load, filtered, setSearch, search, remove, roleFilter, setRoleFilter, sortField, sortOrder, setSort } = useEmployeeStore()

// Adicionar após o campo de busca existente:
<div className="flex flex-wrap gap-3">
  {/* campo de busca existente */}
  <select
    className="select select-bordered select-sm"
    value={roleFilter ?? ''}
    onChange={(e) => setRoleFilter((e.target.value as 'manager' | 'employee') || undefined)}
  >
    <option value="">Todas as funções</option>
    <option value="manager">Gestor</option>
    <option value="employee">Funcionário</option>
  </select>
  <select
    className="select select-bordered select-sm"
    value={`${sortField}-${sortOrder}`}
    onChange={(e) => {
      const [f, o] = e.target.value.split('-') as ['name' | 'salary', 'asc' | 'desc']
      setSort(f, o)
    }}
  >
    <option value="name-asc">Nome A→Z</option>
    <option value="name-desc">Nome Z→A</option>
    <option value="salary-asc">Salário ↑</option>
    <option value="salary-desc">Salário ↓</option>
  </select>
</div>
```

- [ ] **Step E2.4: Rodar testes**

```bash
npm test -- --testPathPattern="employee" --watchAll=false
```

- [ ] **Step E2.5: Commit**

```bash
git add src/viewmodels/employee.viewmodel.ts src/views/pages/EmployeeListPage.tsx src/__tests__/viewmodels/employee.viewmodel.test.ts
git commit -m "feat(employees): add role filter and sort to employee list"
```

---

## SEÇÃO F — Financeiro

### Task F1: Melhorar gráficos

**Contexto:** Substituir `LineChart` por `AreaChart` com linha de saldo, e melhorar o `PieChart` para formato donut com percentuais no tooltip.

**Files:**
- Modify: `src/views/pages/FinancialPage.tsx`

- [ ] **Step F1.1: Escrever teste que falha — AreaChart renderizado**

Criar `src/__tests__/views/FinancialPage.test.tsx` (se não existir):

```tsx
import { render, screen } from '@testing-library/react'
import { FinancialPage } from '@/views/pages/FinancialPage'
import { useTransactionStore } from '@/viewmodels/transaction.viewmodel'

jest.mock('@/viewmodels/transaction.viewmodel')
jest.mock('recharts', () => {
  const React = require('react')
  return {
    AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
    Area: () => null,
    PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => null, Cell: () => null,
    XAxis: () => null, YAxis: () => null, CartesianGrid: () => null,
    Tooltip: () => null, Legend: () => null, ResponsiveContainer: ({ children }: any) => children,
  }
})

const mockMonthly = [{ month: '2024-01', credits: 1000, debits: 500, balance: 500 }]

beforeEach(() => {
  ;(useTransactionStore as unknown as jest.Mock).mockReturnValue({
    load: jest.fn(), filtered: () => [{ id: '1', type: 'credit', amount: 100, description: 'X', category: 'Serviços', date: '2024-01-01', createdAt: '' }],
    remove: jest.fn(), create: jest.fn(), summary: () => ({ totalCredits: 100, totalDebits: 0, balance: 100 }),
    monthly: () => mockMonthly, filters: {}, setFilters: jest.fn(), loading: false, error: null,
  })
})

it('usa AreaChart em vez de LineChart para evolução mensal', () => {
  render(<FinancialPage />)
  expect(screen.getByTestId('area-chart')).toBeInTheDocument()
})

it('usa PieChart para distribuição por categoria', () => {
  render(<FinancialPage />)
  expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
})
```

- [ ] **Step F1.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="FinancialPage" --watchAll=false
```

- [ ] **Step F1.2: Substituir LineChart por AreaChart em FinancialPage**

Em `src/views/pages/FinancialPage.tsx`:

1. Atualizar imports do recharts:
```tsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
```

2. Substituir o bloco `<LineChart>` por:
```tsx
<ResponsiveContainer width="100%" height={220}>
  <AreaChart data={monthlyData}>
    <defs>
      <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="colorDebits" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
    <Tooltip formatter={(v) => (typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : String(v))} />
    <Legend />
    <Area type="monotone" dataKey="credits" stroke="#22c55e" fill="url(#colorCredits)" name="Entradas" />
    <Area type="monotone" dataKey="debits" stroke="#ef4444" fill="url(#colorDebits)" name="Saídas" />
    <Area type="monotone" dataKey="balance" stroke="#3b82f6" fill="none" strokeDasharray="4 2" name="Saldo" />
  </AreaChart>
</ResponsiveContainer>
```

3. Melhorar PieChart: adicionar `innerRadius={50}` (donut), e tooltip com percentual:
```tsx
<Pie
  data={pieData}
  dataKey="value"
  nameKey="name"
  cx="50%"
  cy="50%"
  innerRadius={50}
  outerRadius={85}
  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
>
```

- [ ] **Step F1.3: Rodar testes**

```bash
npm test -- --testPathPattern="FinancialPage" --watchAll=false
```

- [ ] **Step F1.4: Commit**

```bash
git add src/views/pages/FinancialPage.tsx src/__tests__/views/FinancialPage.test.tsx
git commit -m "feat(financial): replace line chart with area chart, improve pie chart to donut with percentage labels"
```

---

### Task F2: Categoria como select no formulário de lançamento

**Contexto:** O campo `category` no formulário de lançamento financeiro é um `<input>` livre. Substituir por `<select>` com categorias predefinidas.

**Files:**
- Modify: `src/models/transaction.model.ts`
- Modify: `src/views/pages/FinancialPage.tsx`

- [ ] **Step F2.1: Escrever teste que falha — select de categoria**

Em `src/__tests__/views/FinancialPage.test.tsx`, adicionar:

```tsx
it('formulário de novo lançamento tem select de categoria com opções predefinidas', async () => {
  render(<FinancialPage />)
  fireEvent.click(screen.getByTitle('Novo lançamento'))  // abrir modal
  const select = screen.getByLabelText(/categoria/i)
  expect(select.tagName).toBe('SELECT')
  expect(screen.getByRole('option', { name: 'Serviços' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Equipamentos' })).toBeInTheDocument()
})
```

Adicionar `import { fireEvent } from '@testing-library/react'` ao arquivo.

- [ ] **Step F2.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="FinancialPage" --watchAll=false
```

- [ ] **Step F2.2: Adicionar TRANSACTION_CATEGORIES ao modelo**

Em `src/models/transaction.model.ts`, adicionar após os imports:

```ts
export const TRANSACTION_CATEGORIES = [
  'Serviços',
  'Equipamentos',
  'Pessoal',
  'Impostos',
  'Combustível',
  'Hospedagem',
  'Alimentação',
  'Outros',
] as const

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number]
```

Atualizar schema para validar contra a lista:
```ts
category: z.enum(TRANSACTION_CATEGORIES, { errorMap: () => ({ message: 'Selecione uma categoria' }) }),
```

- [ ] **Step F2.3: Substituir input por select de categoria em FinancialPage**

Localizar o fieldset `tx-cat` em `FinancialPage.tsx` e substituir o `<input>` por:

```tsx
<fieldset className="fieldset gap-1">
  <label className="label text-xs" htmlFor="tx-cat">Categoria</label>
  <select
    id="tx-cat"
    className={`select select-bordered w-full ${formErrors.category ? 'select-error' : ''}`}
    value={form.category}
    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
  >
    <option value="">Selecione...</option>
    {TRANSACTION_CATEGORIES.map((cat) => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
  {formErrors.category && <p className="text-error text-xs">{formErrors.category}</p>}
</fieldset>
```

Adicionar import: `import { TRANSACTION_CATEGORIES } from '@/models/transaction.model'`

- [ ] **Step F2.4: Rodar testes**

```bash
npm test -- --testPathPattern="FinancialPage|transaction" --watchAll=false
```

- [ ] **Step F2.5: Commit**

```bash
git add src/models/transaction.model.ts src/views/pages/FinancialPage.tsx
git commit -m "feat(financial): replace free-text category input with predefined category select"
```

---

### Task F3: Filtro de categoria e ordenação na listagem de transações

**Contexto:** O viewmodel já tem suporte a `category` em `filters`. Adicionar o select de categoria na barra de filtros e controle de ordenação por data/valor.

**Files:**
- Modify: `src/viewmodels/transaction.viewmodel.ts`
- Modify: `src/views/pages/FinancialPage.tsx`
- Modify: `src/__tests__/viewmodels/transaction.viewmodel.test.ts` (criar se não existir)

- [ ] **Step F3.1: Escrever testes que falham — sort por date/amount**

Em `src/__tests__/viewmodels/transaction.viewmodel.test.ts`:

```ts
import { useTransactionStore } from '@/viewmodels/transaction.viewmodel'

const tx = [
  { id: '1', type: 'credit' as const, amount: 500, description: 'A', category: 'Serviços', date: '2024-03-01', createdAt: '' },
  { id: '2', type: 'debit' as const, amount: 1200, description: 'B', category: 'Outros', date: '2024-01-15', createdAt: '' },
  { id: '3', type: 'credit' as const, amount: 300, description: 'C', category: 'Serviços', date: '2024-02-10', createdAt: '' },
]

describe('filtered — sort', () => {
  beforeEach(() => useTransactionStore.setState({ transactions: tx, filters: {}, sortField: 'date', sortOrder: 'desc' }))

  it('ordena por date desc por padrão', () => {
    const result = useTransactionStore.getState().filtered()
    expect(result[0].id).toBe('1')
    expect(result[2].id).toBe('2')
  })

  it('ordena por amount asc', () => {
    useTransactionStore.getState().setSort('amount', 'asc')
    const result = useTransactionStore.getState().filtered()
    expect(result[0].amount).toBeLessThanOrEqual(result[1].amount)
  })
})
```

- [ ] **Step F3.1b: Rodar testes para confirmar que falham**

```bash
npm test -- --testPathPattern="transaction.viewmodel" --watchAll=false
```

- [ ] **Step F3.2: Adicionar sort ao transaction.viewmodel**

```ts
// Adicionar à interface:
sortField: 'date' | 'amount'
sortOrder: 'asc' | 'desc'
setSort: (field: 'date' | 'amount', order: 'asc' | 'desc') => void

// Estado inicial:
sortField: 'date',
sortOrder: 'desc',

// Ação:
setSort: (sortField, sortOrder) => set({ sortField, sortOrder }),

// Atualizar filtered():
filtered: () => {
  const { transactions, filters, sortField, sortOrder } = get()
  return [...transactions]
    .filter((t) => {
      if (filters.type && t.type !== filters.type) return false
      if (filters.category && t.category !== filters.category) return false
      if (filters.month && !t.date.startsWith(filters.month)) return false
      return true
    })
    .sort((a, b) => {
      const cmp = sortField === 'date'
        ? a.date.localeCompare(b.date)
        : a.amount - b.amount
      return sortOrder === 'asc' ? cmp : -cmp
    })
},
```

- [ ] **Step F3.3: Adicionar filtro de categoria e sort UI na FinancialPage**

Desestruturar `setSort`, `sortField`, `sortOrder` do store. Adicionar à barra de filtros existente:

```tsx
<select
  className="select select-bordered select-sm"
  value={filters.category ?? ''}
  onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
>
  <option value="">Todas as categorias</option>
  {TRANSACTION_CATEGORIES.map((cat) => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>

<select
  className="select select-bordered select-sm"
  value={`${sortField}-${sortOrder}`}
  onChange={(e) => {
    const [f, o] = e.target.value.split('-') as ['date' | 'amount', 'asc' | 'desc']
    setSort(f, o)
  }}
>
  <option value="date-desc">Data ↓</option>
  <option value="date-asc">Data ↑</option>
  <option value="amount-desc">Valor ↓</option>
  <option value="amount-asc">Valor ↑</option>
</select>
```

- [ ] **Step F3.4: Rodar testes**

```bash
npm test -- --testPathPattern="transaction|Financial" --watchAll=false
```

- [ ] **Step F3.5: Commit**

```bash
git add src/viewmodels/transaction.viewmodel.ts src/views/pages/FinancialPage.tsx src/__tests__/viewmodels/transaction.viewmodel.test.ts
git commit -m "feat(financial): add category filter and sort controls to transaction list"
```

---

## SEÇÃO G — Máquinas (filtros e ordenação adicionais)

### Task G1: Ordenação na listagem de máquinas

**Contexto:** `MachineListPage` tem busca por texto mas sem ordenação. Adicionar sort por nome e ano.

**Files:**
- Modify: `src/viewmodels/machine.viewmodel.ts`
- Modify: `src/views/pages/MachineListPage.tsx`
- Modify: `src/__tests__/viewmodels/machine.viewmodel.test.ts` (criar se não existir)

- [ ] **Step G1.1: Escrever testes que falham — sort**

Em `src/__tests__/viewmodels/machine.viewmodel.test.ts`:

```ts
import { useMachineStore } from '@/viewmodels/machine.viewmodel'

const machines = [
  { id: '1', name: 'Zeta', brand: 'Solis', model: 'X', serialNumber: 'S1', year: 2020, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Alfa', brand: 'ABB', model: 'Y', serialNumber: 'S2', year: 2023, createdAt: '', updatedAt: '' },
  { id: '3', name: 'Mira', brand: 'Solis', model: 'Z', serialNumber: 'S3', year: 2019, createdAt: '', updatedAt: '' },
]

describe('filtered — sort', () => {
  beforeEach(() => useMachineStore.setState({ machines, search: '', sortField: 'name', sortOrder: 'asc' }))

  it('ordena por nome asc por padrão', () => {
    const result = useMachineStore.getState().filtered()
    expect(result[0].name).toBe('Alfa')
  })

  it('ordena por year desc', () => {
    useMachineStore.getState().setSort('year', 'desc')
    const result = useMachineStore.getState().filtered()
    expect(result[0].year).toBeGreaterThanOrEqual(result[1].year)
  })
})
```

- [ ] **Step G1.1b: Rodar teste para confirmar que falha**

```bash
npm test -- --testPathPattern="machine.viewmodel" --watchAll=false
```

- [ ] **Step G1.2: Adicionar sort ao machine.viewmodel**

```ts
// Adicionar ao estado:
sortField: 'name' | 'year'
sortOrder: 'asc' | 'desc'
setSort: (field: 'name' | 'year', order: 'asc' | 'desc') => void

// Estado inicial:
sortField: 'name',
sortOrder: 'asc',

// Ação:
setSort: (sortField, sortOrder) => set({ sortField, sortOrder }),

// Atualizar filtered():
filtered: () => {
  const { machines, search, sortField, sortOrder } = get()
  const q = search.toLowerCase()
  return [...machines]
    .filter((m) =>
      !q || m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.model.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      const cmp = sortField === 'name' ? a.name.localeCompare(b.name) : a.year - b.year
      return sortOrder === 'asc' ? cmp : -cmp
    })
},
```

- [ ] **Step G1.3: Adicionar controle de ordenação na MachineListPage**

```tsx
const { load, filtered, remove, loading, error, search, setSearch, sortField, sortOrder, setSort } = useMachineStore()

// Adicionar após o campo de busca existente:
<select
  className="select select-bordered select-sm"
  value={`${sortField}-${sortOrder}`}
  onChange={(e) => {
    const [f, o] = e.target.value.split('-') as ['name' | 'year', 'asc' | 'desc']
    setSort(f, o)
  }}
>
  <option value="name-asc">Nome A→Z</option>
  <option value="name-desc">Nome Z→A</option>
  <option value="year-desc">Ano ↓ (mais novo)</option>
  <option value="year-asc">Ano ↑ (mais antigo)</option>
</select>
```

- [ ] **Step G1.4: Rodar testes**

```bash
npm test -- --testPathPattern="machine" --watchAll=false
```

- [ ] **Step G1.5: Commit**

```bash
git add src/viewmodels/machine.viewmodel.ts src/views/pages/MachineListPage.tsx src/__tests__/viewmodels/machine.viewmodel.test.ts
git commit -m "feat(machines): add sort controls to machine list"
```

---

## Validação Final

- [ ] **Rodar suite completa de testes**

```bash
npm test --watchAll=false
```

Esperado: todos passando, sem regressões.

- [ ] **Build de produção**

```bash
npm run build
```

Esperado: sem erros de TypeScript ou build.
