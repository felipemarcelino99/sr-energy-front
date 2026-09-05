# 05 — Autorização nas rotas (IDOR)

**Severidade:** 🟠 Alta
**Repo:** sr-energy-api
**Esforço:** 6–10h • **Dependências:** nenhuma (sinergia com 07 e 09)

## Problema

Várias rotas autenticam mas **não autorizam** — qualquer usuário logado opera sobre
recursos de terceiros:

| Rota                                                    | Falha                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PUT /jobs/:id` (`jobs.ts:112`)                         | Sem role check — employee edita qualquer job (POST tem check, PUT não)                     |
| `PATCH /jobs/:id/cancel` (`jobs.ts:122`)                | Sem role check nem guard de status                                                         |
| `GET /jobs/:id` (`jobs.ts:51`)                          | Employee lê job de qualquer colega (a listagem filtra, o detalhe não)                      |
| `GET/PATCH /jobs/:id/checklist*`                        | Sem verificação de que o job é do employee                                                 |
| `POST/PUT /jobs/:id/report` (`reports.ts`)              | Não verifica que o job pertence ao employee                                                |
| `POST /reports/:id/evidences`                           | Sem ownership (qualquer um anexa em qualquer relatório)                                    |
| `PATCH /notifications/:id/read` (`notifications.ts:21`) | Falta `.eq('user_id', req.user.id)`                                                        |
| `GET /employees` + `GET /employees/:id`                 | Expõem **salário** de todos para qualquer autenticado (tratado em conjunto com o plano 06) |

## Matriz de autorização alvo

| Recurso                    | admin            | manager | employee                  |
| -------------------------- | ---------------- | ------- | ------------------------- |
| Job: criar/editar/cancelar | ✅               | ✅      | ❌                        |
| Job: ler detalhe           | ✅               | ✅      | ✅ só os seus             |
| Checklist: ler/marcar      | ✅               | ✅      | ✅ só dos seus jobs       |
| Relatório: criar/editar    | ✅               | ✅      | ✅ só dos seus jobs       |
| Evidência: anexar          | ✅               | ✅      | ✅ só nos seus relatórios |
| Notificação: marcar lida   | ✅/❌ só as suas | idem    | idem                      |

> Validar a matriz com o negócio antes de implementar (ex.: manager pode editar
> relatório de employee? Assumi que sim).

## Passos

### 1. Extrair helpers de ownership (`src/utils/ownership.ts`)

O padrão "buscar employee pelo user_id e comparar com o dono do recurso" repete-se em
jobs, reports e checklists — centralizar:

```ts
export async function getEmployeeIdForUser(db: SupabaseClient, userId: string) {
  const { data } = await db.from('employees').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

/** admin/manager passam; employee precisa ser o dono do job */
export async function assertJobAccess(
  db: SupabaseClient,
  user: { id: string; role: Role },
  jobId: string
): Promise<{ ok: true; job: any } | { ok: false; code: 403 | 404 }> {
  const { data: job } = await db.from('jobs').select('*').eq('id', jobId).single()
  if (!job) return { ok: false, code: 404 }
  if (user.role === 'admin' || user.role === 'manager') return { ok: true, job }
  const empId = await getEmployeeIdForUser(db, user.id)
  if (!empId || job.employee_id !== empId) return { ok: false, code: 403 }
  return { ok: true, job }
}
```

> Retornar 404 (e não 403) quando o recurso não existe; para employee sem acesso,
> 403 é aceitável aqui porque a existência de jobs não é sensível — manter consistente.

### 2. (TDD) Testes por rota — escrever todos ANTES das correções

Em `tests/routes/jobs.test.ts`, `reports.test.ts`, `notifications.test.ts`, adicionar
para cada rota da tabela acima os casos:

```ts
it('PUT /jobs/:id retorna 403 para role employee', ...)
it('PATCH /jobs/:id/cancel retorna 403 para role employee', ...)
it('GET /jobs/:id retorna 403 para employee que não é dono', ...)
it('GET /jobs/:id retorna job para o employee dono', ...)
it('PATCH /jobs/:id/checklist/:itemId nega item de job alheio', ...)
it('POST /jobs/:id/report nega job de outro employee', ...)
it('POST /reports/:id/evidences nega relatório alheio', ...)
it('PATCH /notifications/:id/read não altera notificação de outro usuário', ...)
```

Rodar: todos devem **falhar** (vermelho) confirmando as vulnerabilidades.

### 3. Implementar as correções (verde)

- `PUT /jobs/:id` e `PATCH /jobs/:id/cancel`: adicionar
  `onRequest: [guard, requireRoles('admin', 'manager')]` (consistente com POST).
- `GET /jobs/:id`, rotas de checklist, `POST/PUT report`, `POST evidences`:
  usar `assertJobAccess` (para evidences: resolver `report → job_id` antes).
- `notifications.ts:21`:

```ts
.update({ read: true })
.eq('id', req.params.id)
.eq('user_id', req.user.id)   // <- linha que falta
```

- Cancel: incluir guard de status para idempotência —
  `.eq('id', id).not('status', 'in', '("cancelled","completed")')` e retornar 409 se
  nenhuma linha afetada (integra com plano 07).

### 4. Varredura final

Grep de auditoria para garantir que nenhuma rota mutável ficou só com `guard`:

```bash
rg "fastify\.(post|put|patch|delete)" src/routes -A 1 | rg -v "requireRoles|assert"
```

Revisar manualmente cada hit restante e justificar (ex.: `/chat` é aberto a todos os
autenticados por design; `/notifications/read-all` filtra por user_id no corpo).
Conferir também `schedule-events.ts`, `bags.ts`, `tools.ts`, `transactions.ts`,
`contracts.ts`, `machines.ts` contra a matriz.

## Riscos e rollback

- **Risco de regressão funcional:** o front pode estar usando rotas além do que a UI
  sugere (ex.: employee chamando PUT /jobs no fluxo de finalização). Mitigação: rodar
  `npm run cy:run` completo com usuário employee e manager antes do merge; buscar no
  front (`rg "api\.(put|patch)\('/jobs"`) quem chama o quê.
- Rollback: revert do commit — as mudanças são aditivas e localizadas.

## Critérios de aceite

- [ ] Todos os testes novos de 403/404 verdes; suíte completa verde.
- [ ] Matriz de autorização validada com o negócio e documentada no `backend-plan.md`.
- [ ] Varredura `rg` sem rota mutável desprotegida não justificada.
- [ ] e2e Cypress com as três roles passando.
