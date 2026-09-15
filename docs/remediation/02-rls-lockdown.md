# 02 — RLS lockdown em todas as tabelas

**Severidade:** 🔴 Crítica
**Repo:** sr-energy-api (migration) — sem mudança de código de aplicação
**Esforço:** 3–5h • **Dependências:** 01 • **Bloqueia:** 06

## Problema

A `VITE_SUPABASE_ANON_KEY` + URL estão no bundle do front (inevitável — são públicas por
design). Qualquer usuário autenticado pode falar **diretamente com o PostgREST**,
ignorando a API Fastify e todos os guards de role.

A migration `010_enable_rls.sql` habilitou RLS apenas em `employees`, `contracts`,
`transactions`, `jobs`, `machines`, `schedule_events` (+ `user_roles` na 009). Tabelas
**sem RLS** (acesso livre via PostgREST para o role `authenticated`, e possivelmente
`anon`):

`salary_adjustments`, `machine_chunks`, `job_reports`, `evidences`, `notifications`,
`schedule_event_employees`, `tools`, `machine_tools`, `job_checklists`,
`rag_curated_answers`, `machine_overviews`, `bags`, `calibration_certificates`,
`clients`.

## Decisão de arquitetura (premissa do plano)

O front usa `supabase-js` **somente para auth** (verificado: apenas
`src/services/auth.service.ts`, `api.ts`, `auth.context.tsx`, `ChangePasswordPage.tsx`
importam o client). Todo dado trafega pela API Fastify, que usa a
`SERVICE_ROLE_KEY` (bypassa RLS).

Portanto o modelo-alvo é simples e auditável:

> **PostgREST = negado para tudo, exceto leitura da própria role.**
> Dados só via API.

Isso também torna as policies "permissivas" da 010 (`jobs_authenticated_select`,
`machines_authenticated_select`, `schedule_events_authenticated_select`, `emp_self_select`,
`contracts_self_select`) indesejadas — elas abrem leitura direta que ninguém usa.

## Passos

### 1. (TDD) Escrever o teste de verificação primeiro

Criar `sr-energy-api/tests/security/rls.test.ts` que usa `@supabase/supabase-js` com a
**anon key** (env `SUPABASE_ANON_KEY` apenas em ambiente de teste) e um usuário de teste
autenticado:

```ts
const TABLES = [
  'employees',
  'contracts',
  'transactions',
  'jobs',
  'machines',
  'schedule_events',
  'salary_adjustments',
  'machine_chunks',
  'job_reports',
  'evidences',
  'notifications',
  'schedule_event_employees',
  'tools',
  'machine_tools',
  'job_checklists',
  'rag_curated_answers',
  'machine_overviews',
  'bags',
  'calibration_certificates',
  'clients',
]

describe.each(TABLES)('RLS lockdown: %s', (table) => {
  it('nega SELECT via anon key autenticada', async () => {
    const { data, error } = await authedClient.from(table).select('*').limit(1)
    // RLS sem policy: retorna lista vazia (select) ou erro (insert/update/delete)
    expect(data ?? []).toHaveLength(0)
  })
  it('nega INSERT', async () => {
    const { error } = await authedClient.from(table).insert({})
    expect(error).not.toBeNull()
  })
})

it('permite ler a própria role em user_roles', async () => {
  const { data, error } = await authedClient.from('user_roles').select('role')
  expect(error).toBeNull()
  expect(data!.length).toBeGreaterThan(0)
})
```

> Esse teste exige um projeto Supabase local (`supabase start`) ou branch de teste.
> Se não houver stack local, marcar como suite separada (`npm run test:rls`) executada
> contra o ambiente de staging.

### 2. Migration `015_rls_lockdown.sql`

```sql
-- 015: RLS deny-all — todo acesso a dados passa pela API (service role)

-- 1) Habilitar RLS nas tabelas que ficaram de fora da 010
ALTER TABLE salary_adjustments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_chunks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences                ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_event_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_tools            ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_checklists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_curated_answers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_overviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bags                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients                  ENABLE ROW LEVEL SECURITY;
-- (sem CREATE POLICY: RLS habilitado sem policy = deny-all para anon/authenticated;
--  o backend usa service_role, que bypassa RLS)

-- 2) Remover policies da 010 que permitiam acesso direto via PostgREST
--    (ninguém as usa: o front não consulta dados via supabase-js)
DROP POLICY IF EXISTS "emp_self_select"                       ON employees;
DROP POLICY IF EXISTS "emp_admin_all"                         ON employees;
DROP POLICY IF EXISTS "contracts_self_select"                 ON contracts;
DROP POLICY IF EXISTS "contracts_admin_all"                   ON contracts;
DROP POLICY IF EXISTS "transactions_admin_all"                ON transactions;
DROP POLICY IF EXISTS "jobs_authenticated_select"             ON jobs;
DROP POLICY IF EXISTS "jobs_manager_admin_all"                ON jobs;
DROP POLICY IF EXISTS "machines_authenticated_select"         ON machines;
DROP POLICY IF EXISTS "machines_manager_admin_all"            ON machines;
DROP POLICY IF EXISTS "schedule_events_authenticated_select"  ON schedule_events;
DROP POLICY IF EXISTS "schedule_events_manager_admin_all"     ON schedule_events;

-- 3) Manter em user_roles a policy users_read_own_role (necessária ao plano 06).
```

> **Atenção:** as policies de admin da 010 usavam subquery em `user_roles` — se a policy
> `users_read_own_role` for a única de `user_roles`, a subquery `EXISTS` dentro de outra
> policy roda como o dono da tabela e continuaria funcionando; mas como estamos dropando
> essas policies, o ponto é irrelevante. Citação aqui só para registro da decisão.

### 3. Storage

No dashboard/CLI do Supabase, revisar as policies de `storage.objects` por bucket.
O bucket `evidences` será tratado no plano 04; verificar que nenhum bucket tem policy
de INSERT/SELECT para `authenticated` que não seja intencional.

### 4. Aplicar e validar

1. Aplicar em branch/staging do Supabase primeiro (`supabase db push` ou
   `mcp apply_migration`).
2. Rodar a suite RLS (passo 1) → verde.
3. Rodar a suite completa do backend (`npm test`) — deve permanecer verde, pois a API
   usa service role.
4. Rodar o front em staging e executar `npm run cy:run` — fluxos de login, CRUD e
   dashboard intactos.
5. Rodar advisors de segurança do Supabase → zero achados de "RLS disabled".

## Riscos e rollback

- **Risco:** algum código esquecido consultando PostgREST direto quebraria
  silenciosamente (retorna `[]` em select). Mitigação: grep por `supabase.from(` no
  front (hoje: zero ocorrências fora de testes) e e2e completo em staging.
- **Risco:** Realtime/subscriptions do Supabase respeitam RLS — hoje não há uso de
  realtime no front; se for adicionado depois, criar policies específicas.
- **Rollback:** migration reversa reabilitando as policies antigas (guardar o SQL da 010
  como referência). `DISABLE ROW LEVEL SECURITY` é último recurso.

## Critérios de aceite

- [ ] Todas as 20 tabelas de negócio com RLS habilitado.
- [ ] Nenhuma policy para `anon`/`authenticated` exceto `users_read_own_role`.
- [ ] Suite `tests/security/rls.test.ts` verde contra staging.
- [ ] `npm test` (back) e `npm run cy:run` (front) verdes.
- [ ] Advisors do Supabase sem achados de RLS.
