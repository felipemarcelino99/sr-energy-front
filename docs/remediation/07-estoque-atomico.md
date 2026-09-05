# 07 — Estoque atômico + cancelamento idempotente

**Severidade:** 🟠 Alta (integridade de dados)
**Repo:** sr-energy-api
**Esforço:** 6–8h • **Dependências:** 01 (migrations versionadas)

## Problema

Em `src/routes/jobs.ts`:

1. **Race condition** (linhas 77–98): o débito de estoque é read-modify-write em loop
   JS (`tool.quantity - mt.quantity_required` lido na API e escrito de volta). Dois
   jobs criados simultaneamente para a mesma máquina corrompem `tools.quantity`.
2. **Sem atomicidade:** job + checklist + estoque + notificação são 4+ escritas
   independentes; falha no meio deixa estado inconsistente (job sem checklist, estoque
   debitado sem job, etc.).
3. **Cancel não idempotente** (linhas 122–129): `PATCH /:id/cancel` não checa o status
   atual → cada chamada repete `restoreToolStock` e **infla o estoque**.
4. **Restauração imprecisa** (linhas 207–234): restaura `quantity_required` da config
   atual de `machine_tools`, não o que foi de fato debitado — se o débito foi capado em
   0 (`Math.max(0, ...)`) ou a config da máquina mudou depois, a restauração devolve a
   mais ou a menos.
5. Mesmo padrão em `employees.ts:138-141` (salary adjustment com `Promise.all` sem
   transação) — corrigir junto.

## Estratégia

Mover a lógica para **funções SQL (RPC)** que rodam em transação no Postgres, e
registrar o **consumo real** por job em uma tabela própria para restauração exata.

## Passos

### 1. Migration `017_atomic_stock.sql`

```sql
-- Registro do que foi de fato debitado por job (fonte da restauração)
CREATE TABLE job_tool_consumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES tools(id),
  qty_consumed int NOT NULL CHECK (qty_consumed >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE (job_id, tool_id)
);
ALTER TABLE job_tool_consumptions ENABLE ROW LEVEL SECURITY;  -- deny-all (padrão plano 02)

-- Cria job + checklist + debita estoque em UMA transação.
-- Retorna o job + nomes de ferramentas com estoque insuficiente.
CREATE OR REPLACE FUNCTION create_job_with_checklist(p_job jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_job jobs;
  v_insufficient text[] := '{}';
  mt record;
  v_consumed int;
BEGIN
  INSERT INTO jobs SELECT * FROM jsonb_populate_record(null::jobs, p_job)
  RETURNING * INTO v_job;

  FOR mt IN
    SELECT m.tool_id, m.quantity_required, t.name, t.quantity
    FROM machine_tools m JOIN tools t ON t.id = m.tool_id
    WHERE m.machine_id = v_job.machine_id
    FOR UPDATE OF t                       -- lock: serializa débitos concorrentes
  LOOP
    IF mt.quantity < mt.quantity_required THEN
      v_insufficient := array_append(v_insufficient, mt.name);
    END IF;

    v_consumed := LEAST(mt.quantity, mt.quantity_required);  -- débito real (>=0)
    UPDATE tools SET quantity = quantity - v_consumed, updated_at = now()
    WHERE id = mt.tool_id;

    INSERT INTO job_tool_consumptions (job_id, tool_id, qty_consumed)
    VALUES (v_job.id, mt.tool_id, v_consumed);

    INSERT INTO job_checklists (job_id, employee_id, tool_id, phase)
    VALUES (v_job.id, v_job.employee_id, mt.tool_id, 'pre_work');
  END LOOP;

  RETURN jsonb_build_object('job', to_jsonb(v_job), 'insufficient_tools', v_insufficient);
END $$;

-- Cancela com guard de status e restaura EXATAMENTE o consumido, uma única vez.
CREATE OR REPLACE FUNCTION cancel_job(p_job_id uuid)
RETURNS jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_job jobs;
BEGIN
  UPDATE jobs SET status = 'cancelled', updated_at = now()
  WHERE id = p_job_id AND status NOT IN ('cancelled', 'completed')
  RETURNING * INTO v_job;

  IF v_job.id IS NULL THEN
    RAISE EXCEPTION 'JOB_NOT_CANCELLABLE' USING ERRCODE = 'P0001';
  END IF;

  UPDATE tools t SET quantity = t.quantity + c.qty_consumed, updated_at = now()
  FROM job_tool_consumptions c
  WHERE c.job_id = p_job_id AND c.tool_id = t.id;

  DELETE FROM job_tool_consumptions WHERE job_id = p_job_id;  -- impede dupla restauração
  RETURN v_job;
END $$;

-- Ajuste salarial atômico (corrige employees.ts:138)
CREATE OR REPLACE FUNCTION adjust_salary(p_employee_id uuid, p_new_salary numeric, p_reason text)
RETURNS salary_adjustments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prev numeric;
  v_adj salary_adjustments;
BEGIN
  SELECT salary INTO v_prev FROM employees WHERE id = p_employee_id FOR UPDATE;
  IF v_prev IS NULL THEN RAISE EXCEPTION 'EMPLOYEE_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  INSERT INTO salary_adjustments (employee_id, previous_salary, new_salary, reason)
  VALUES (p_employee_id, v_prev, p_new_salary, p_reason) RETURNING * INTO v_adj;

  UPDATE employees SET salary = p_new_salary, updated_at = now() WHERE id = p_employee_id;
  RETURN v_adj;
END $$;

-- Como as funções são SECURITY DEFINER, restringir execução:
REVOKE EXECUTE ON FUNCTION create_job_with_checklist(jsonb) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION cancel_job(uuid)                 FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION adjust_salary(uuid, numeric, text) FROM public, anon, authenticated;
-- service_role mantém EXECUTE (bypassa de toda forma; o REVOKE protege contra PostgREST)
```

> Nota: jobs antigos criados antes desta migration não têm registros em
> `job_tool_consumptions` — `cancel_job` simplesmente não restaura nada para eles
> (comportamento seguro; documentar).

### 2. (TDD) Testes de rota primeiro

`tests/routes/jobs.test.ts` (mocks de `db.rpc`):

```ts
it('POST /jobs chama rpc create_job_with_checklist e repassa insufficient_tools', ...)
it('PATCH /:id/cancel chama rpc cancel_job', ...)
it('PATCH /:id/cancel retorna 409 quando job já cancelado/completed', ...)
```

E um teste de integração SQL (se houver stack local `supabase start`):
cancelar duas vezes → estoque restaurado uma única vez.

### 3. Refatorar `jobs.ts`

```ts
// POST /jobs
const { data, error } = await db.rpc('create_job_with_checklist', { p_job: parsed.data })
if (error) {
  req.log.error(error)
  return reply.status(500).send({ error: 'Erro ao criar trabalho' })
}
// notificação segue fora da transação (efeito colateral não-crítico)

// PATCH /:id/cancel
const { data, error } = await db.rpc('cancel_job', { p_job_id: req.params.id })
if (error?.message?.includes('JOB_NOT_CANCELLABLE'))
  return reply.status(409).send({ error: 'Trabalho já cancelado ou concluído' })
```

Apagar `restoreToolStock` e o loop de débito manual. Refatorar
`POST /employees/:id/salary-adjustments` para `db.rpc('adjust_salary', ...)`.

### 4. Frontend

Tratar 409 do cancel com toast informativo (`job.viewmodel` / página de detalhe).
Teste de viewmodel correspondente primeiro.

## Riscos e rollback

- **Risco:** divergência de assinatura `jsonb_populate_record` vs payload zod (campos
  opcionais ausentes) — coberto pelos testes de integração; o zod do route continua
  validando o shape antes do RPC.
- **Risco:** `SECURITY DEFINER` mal restrito viraria escada de privilégio via PostgREST
  — mitigado pelos `REVOKE EXECUTE` acima (testar no teste RLS do plano 02).
- Rollback: as rotas antigas podem ser restauradas por revert de código; as funções SQL
  ficam inertes sem chamadores.

## Critérios de aceite

- [ ] Criação de job é all-or-nothing (falha de checklist não deixa estoque debitado).
- [ ] Teste de concorrência (ou raciocínio via `FOR UPDATE`) documentado.
- [ ] Cancel duplo → 409, estoque restaurado exatamente uma vez, valor exato consumido.
- [ ] `restoreToolStock` e loops manuais removidos.
- [ ] Suites verdes + e2e criar/cancelar job.
