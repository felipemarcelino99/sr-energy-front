# RAG Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add curated answers (thumbs-up curation), multi-machine comparison, and cached machine overviews to the existing RAG pipeline.

**Architecture:** Separate services per feature (`rag.curated.service.ts`, `rag.overview.service.ts`) extend the existing `rag.service.ts` without turning it into a god-file. New backend routes (`POST /chat/compare`, `POST /chat/curate`, `DELETE /chat/curate/:id`, `GET /machines/:id/overview`) and frontend components (`ChatMessage.tsx`, `MachineOverview.tsx`) complete the stack.

**Tech Stack:** Fastify, Supabase (pgvector), Voyage AI embeddings, Anthropic Claude (`claude-haiku-4-5-20251001`), React + Zustand, Tailwind + DaisyUI, Jest (backend + frontend), Testing Library (frontend)

---

## File Map

| Action | Path |
|--------|------|
| CREATE | `sr-energy-back/sr-energy-api/supabase/migrations/011_rag_features.sql` |
| MODIFY | `sr-energy-back/sr-energy-api/src/services/rag.service.ts` |
| CREATE | `sr-energy-back/sr-energy-api/src/services/rag.curated.service.ts` |
| CREATE | `sr-energy-back/sr-energy-api/src/services/rag.overview.service.ts` |
| MODIFY | `sr-energy-back/sr-energy-api/src/routes/chat.ts` |
| MODIFY | `sr-energy-back/sr-energy-api/src/routes/machines.ts` |
| MODIFY | `sr-energy-back/sr-energy-api/tests/services/rag.service.test.ts` |
| CREATE | `sr-energy-back/sr-energy-api/tests/services/rag.curated.service.test.ts` |
| CREATE | `sr-energy-back/sr-energy-api/tests/services/rag.overview.service.test.ts` |
| MODIFY | `sr-energy-back/sr-energy-api/tests/routes/chat.test.ts` |
| MODIFY | `sr-energy-back/sr-energy-api/tests/routes/machines.test.ts` |
| MODIFY | `sr-energy-front/src/models/chat.model.ts` |
| MODIFY | `sr-energy-front/src/services/chat.service.ts` |
| MODIFY | `sr-energy-front/src/services/machine.service.ts` |
| MODIFY | `sr-energy-front/src/viewmodels/chat.viewmodel.ts` |
| CREATE | `sr-energy-front/src/views/components/ChatMessage.tsx` |
| CREATE | `sr-energy-front/src/views/components/MachineOverview.tsx` |
| MODIFY | `sr-energy-front/src/__tests__/viewmodels/chat.viewmodel.test.ts` |
| CREATE | `sr-energy-front/src/__tests__/views/ChatMessage.test.tsx` |
| CREATE | `sr-energy-front/src/__tests__/views/MachineOverview.test.tsx` |

---

## Task 1: Database Migration 011

**Files:**
- Create: `sr-energy-back/sr-energy-api/supabase/migrations/011_rag_features.sql`

> No test step — SQL migrations are not unit-tested. Apply and verify manually or via Supabase CLI.

- [ ] **Step 1: Create the migration file**

```sql
-- 011_rag_features.sql

-- 1. RPC: match_machine_chunks (referenced in rag.service.ts but never created)
CREATE OR REPLACE FUNCTION match_machine_chunks(
  p_machine_id uuid,
  p_embedding  vector(1024),
  p_limit      int DEFAULT 5
)
RETURNS TABLE(content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT content,
         1 - (embedding <=> p_embedding) AS similarity
  FROM machine_chunks
  WHERE machine_id = p_machine_id
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- 2. RPC: match_chunks_multi_machine (for comparison feature)
CREATE OR REPLACE FUNCTION match_chunks_multi_machine(
  p_machine_ids uuid[],
  p_embedding   vector(1024),
  p_limit_per   int DEFAULT 5
)
RETURNS TABLE(machine_id uuid, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT machine_id,
         content,
         1 - (embedding <=> p_embedding) AS similarity
  FROM machine_chunks
  WHERE machine_id = ANY(p_machine_ids)
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit_per * array_length(p_machine_ids, 1);
$$;

-- 3. pdf_hash column on machines (used to invalidate overview cache)
ALTER TABLE machines ADD COLUMN IF NOT EXISTS pdf_hash text;

-- 4. Curated answers table
CREATE TABLE IF NOT EXISTS rag_curated_answers (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id         uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  question           text NOT NULL,
  question_embedding vector(1024) NOT NULL,
  answer             text NOT NULL,
  created_by         uuid NOT NULL REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_curated_machine ON rag_curated_answers(machine_id);

-- 5. Machine overviews cache table
CREATE TABLE IF NOT EXISTS machine_overviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id   uuid NOT NULL UNIQUE REFERENCES machines(id) ON DELETE CASCADE,
  content      text NOT NULL,
  pdf_hash     text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Apply the migration**

```bash
# From sr-energy-back/sr-energy-api/
npx supabase db push
# or via Supabase dashboard: SQL Editor → paste and run
```

Expected: all statements execute without error.

- [ ] **Step 3: Commit**

```bash
git -C "sr-energy-back/sr-energy-api" add supabase/migrations/011_rag_features.sql
git -C "sr-energy-back/sr-energy-api" commit -m "feat(db): add rag_curated_answers, machine_overviews, match RPCs, pdf_hash"
```

---

## Task 2: Export `embedTexts` from `rag.service.ts` + add `compareAcrossMachines`

**Files:**
- Modify: `sr-energy-back/sr-energy-api/src/services/rag.service.ts`
- Modify: `sr-energy-back/sr-energy-api/tests/services/rag.service.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/services/rag.service.test.ts`:

```typescript
import * as ragService from '@/services/rag.service'
import Anthropic from '@anthropic-ai/sdk'
import { VoyageAIClient } from 'voyageai'

jest.mock('@anthropic-ai/sdk')
jest.mock('voyageai')

// (existing chunkText tests remain)

describe('compareAcrossMachines', () => {
  const mockSupabase: any = { rpc: jest.fn() }

  it('returns a comparative answer from Claude', async () => {
    const fakeEmbedding = Array(1024).fill(0.1)
    const mockVoyage = { embed: jest.fn().mockResolvedValue({ data: [{ embedding: fakeEmbedding }] }) }
    ;(VoyageAIClient as jest.Mock).mockImplementation(() => mockVoyage)

    mockSupabase.rpc.mockResolvedValue({
      data: [
        { machine_id: 'machine-1', content: 'Pressão máx: 200 bar', similarity: 0.95 },
        { machine_id: 'machine-2', content: 'Pressão máx: 150 bar', similarity: 0.90 },
      ],
      error: null,
    })

    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Máquina 1 suporta mais pressão.' }],
    })
    ;(Anthropic as jest.Mock).mockImplementation(() => ({ messages: { create: mockCreate } }))

    const result = await ragService.compareAcrossMachines(
      mockSupabase,
      ['machine-1', 'machine-2'],
      'Qual máquina suporta maior pressão?'
    )
    expect(result).toBe('Máquina 1 suporta mais pressão.')
    expect(mockSupabase.rpc).toHaveBeenCalledWith('match_chunks_multi_machine', expect.any(Object))
  })

  it('throws if vector search fails', async () => {
    const fakeEmbedding = Array(1024).fill(0.1)
    const mockVoyage = { embed: jest.fn().mockResolvedValue({ data: [{ embedding: fakeEmbedding }] }) }
    ;(VoyageAIClient as jest.Mock).mockImplementation(() => mockVoyage)

    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    await expect(
      ragService.compareAcrossMachines(mockSupabase, ['m1', 'm2'], 'pergunta')
    ).rejects.toThrow('Vector search failed: DB error')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="rag.service" --no-coverage
```

Expected: FAIL — `compareAcrossMachines is not a function`

- [ ] **Step 3: Export `embedTexts` and add `compareAcrossMachines` to `rag.service.ts`**

Change `async function embedTexts` to `export async function embedTexts` (line ~33).

Then add at the end of `rag.service.ts`:

```typescript
/** Busca chunks de múltiplas máquinas e retorna resposta comparativa */
export async function compareAcrossMachines(
  supabase: SupabaseClient,
  machineIds: string[],
  question: string
): Promise<string> {
  const [queryEmbedding] = await embedTexts([question])

  const { data: chunks, error } = await supabase.rpc('match_chunks_multi_machine', {
    p_machine_ids: machineIds,
    p_embedding: queryEmbedding,
    p_limit_per: 5,
  })
  if (error) throw new Error(`Vector search failed: ${error.message}`)

  const byMachine = new Map<string, string[]>()
  for (const chunk of (chunks as { machine_id: string; content: string }[])) {
    if (!byMachine.has(chunk.machine_id)) byMachine.set(chunk.machine_id, [])
    byMachine.get(chunk.machine_id)!.push(chunk.content)
  }

  const machinesWithNoData = machineIds.filter((id) => !byMachine.has(id))

  let context = ''
  for (const [machineId, contents] of byMachine) {
    context += `=== Máquina ${machineId} ===\n${contents.join('\n\n')}\n\n`
  }
  if (machinesWithNoData.length > 0) {
    context += `\nNota: as seguintes máquinas não possuem manual indexado: ${machinesWithNoData.join(', ')}`
  }

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `Você é um assistente técnico especializado. Compare as informações das máquinas com base nos manuais fornecidos. Se alguma máquina não tiver dados, mencione isso na resposta.`,
    messages: [{ role: 'user', content: `${context}\n\nPergunta: ${question}` }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="rag.service" --no-coverage
```

Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git -C "sr-energy-back/sr-energy-api" add src/services/rag.service.ts tests/services/rag.service.test.ts
git -C "sr-energy-back/sr-energy-api" commit -m "feat(rag): export embedTexts + add compareAcrossMachines"
```

---

## Task 3: `rag.curated.service.ts`

**Files:**
- Create: `sr-energy-back/sr-energy-api/src/services/rag.curated.service.ts`
- Create: `sr-energy-back/sr-energy-api/tests/services/rag.curated.service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/services/rag.curated.service.test.ts`:

```typescript
import {
  findCuratedAnswer,
  saveCuratedAnswer,
  deleteCuratedAnswer,
} from '@/services/rag.curated.service'

const makeSupabase = (overrides: any = {}): any => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  ...overrides,
})

function makeEmbedding(value: number): number[] {
  return Array(1024).fill(value)
}

describe('findCuratedAnswer', () => {
  it('returns the answer when cosine similarity exceeds 0.92', async () => {
    const embedding = makeEmbedding(1)
    const supabase = makeSupabase()
    supabase.eq.mockResolvedValue({
      data: [{ answer: 'Resposta correta', question_embedding: makeEmbedding(1) }],
      error: null,
    })

    const result = await findCuratedAnswer(supabase, 'machine-1', embedding)
    expect(result).toBe('Resposta correta')
  })

  it('returns null when similarity is below threshold', async () => {
    const queryEmbedding = makeEmbedding(1)
    const supabase = makeSupabase()
    // Orthogonal embedding → similarity ≈ 0
    const orthogonal = Array(1024).fill(0)
    orthogonal[0] = 1
    orthogonal[1] = -1
    supabase.eq.mockResolvedValue({
      data: [{ answer: 'Irrelevante', question_embedding: orthogonal }],
      error: null,
    })

    const result = await findCuratedAnswer(supabase, 'machine-1', queryEmbedding)
    expect(result).toBeNull()
  })

  it('returns null when no curated answers exist', async () => {
    const supabase = makeSupabase()
    supabase.eq.mockResolvedValue({ data: [], error: null })
    const result = await findCuratedAnswer(supabase, 'machine-1', makeEmbedding(1))
    expect(result).toBeNull()
  })
})

describe('saveCuratedAnswer', () => {
  it('inserts a curated answer row', async () => {
    const supabase = makeSupabase()
    supabase.insert = jest.fn().mockResolvedValue({ error: null })

    await expect(
      saveCuratedAnswer(supabase, 'machine-1', 'Pergunta?', makeEmbedding(0.5), 'Resposta.', 'user-1')
    ).resolves.toBeUndefined()

    expect(supabase.from).toHaveBeenCalledWith('rag_curated_answers')
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ machine_id: 'machine-1', question: 'Pergunta?', answer: 'Resposta.' })
    )
  })

  it('throws on insert error', async () => {
    const supabase = makeSupabase()
    supabase.insert = jest.fn().mockResolvedValue({ error: { message: 'DB failure' } })
    await expect(
      saveCuratedAnswer(supabase, 'machine-1', 'Q', makeEmbedding(0.5), 'A', 'user-1')
    ).rejects.toThrow('Failed to save curated answer: DB failure')
  })
})

describe('deleteCuratedAnswer', () => {
  it('deletes by id', async () => {
    const supabase = makeSupabase()
    supabase.eq = jest.fn().mockResolvedValue({ error: null })

    await expect(deleteCuratedAnswer(supabase, 'answer-id')).resolves.toBeUndefined()
    expect(supabase.from).toHaveBeenCalledWith('rag_curated_answers')
    expect(supabase.delete).toHaveBeenCalled()
  })

  it('throws on delete error', async () => {
    const supabase = makeSupabase()
    supabase.eq = jest.fn().mockResolvedValue({ error: { message: 'DB failure' } })
    await expect(deleteCuratedAnswer(supabase, 'bad-id')).rejects.toThrow('Failed to delete curated answer')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="rag.curated" --no-coverage
```

Expected: FAIL — `Cannot find module '@/services/rag.curated.service'`

- [ ] **Step 3: Implement `rag.curated.service.ts`**

Create `src/services/rag.curated.service.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

const SIMILARITY_THRESHOLD = 0.92

export async function findCuratedAnswer(
  supabase: SupabaseClient,
  machineId: string,
  queryEmbedding: number[]
): Promise<string | null> {
  const { data, error } = await supabase
    .from('rag_curated_answers')
    .select('answer, question_embedding')
    .eq('machine_id', machineId)
  if (error || !data || data.length === 0) return null

  let best: { answer: string; similarity: number } | null = null
  for (const row of data as { answer: string; question_embedding: number[] }[]) {
    const sim = cosineSimilarity(queryEmbedding, row.question_embedding)
    if (sim > SIMILARITY_THRESHOLD && (!best || sim > best.similarity)) {
      best = { answer: row.answer, similarity: sim }
    }
  }
  return best?.answer ?? null
}

export async function saveCuratedAnswer(
  supabase: SupabaseClient,
  machineId: string,
  question: string,
  questionEmbedding: number[],
  answer: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('rag_curated_answers').insert({
    machine_id: machineId,
    question,
    question_embedding: questionEmbedding,
    answer,
    created_by: userId,
  })
  if (error) throw new Error(`Failed to save curated answer: ${error.message}`)
}

export async function deleteCuratedAnswer(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('rag_curated_answers')
    .delete()
    .eq('id', id)
  if (error) throw new Error(`Failed to delete curated answer: ${error.message}`)
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="rag.curated" --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C "sr-energy-back/sr-energy-api" add src/services/rag.curated.service.ts tests/services/rag.curated.service.test.ts
git -C "sr-energy-back/sr-energy-api" commit -m "feat(rag): add rag.curated.service with find/save/delete"
```

---

## Task 4: `rag.overview.service.ts`

**Files:**
- Create: `sr-energy-back/sr-energy-api/src/services/rag.overview.service.ts`
- Create: `sr-energy-back/sr-energy-api/tests/services/rag.overview.service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/services/rag.overview.service.test.ts`:

```typescript
import { getOrGenerateOverview } from '@/services/rag.overview.service'
import Anthropic from '@anthropic-ai/sdk'

jest.mock('@anthropic-ai/sdk')

const makeSupabase = (machineRow: any, overviewRow: any, chunksData: any): any => {
  const fromMock = jest.fn().mockImplementation((table: string) => {
    if (table === 'machines') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: machineRow, error: machineRow ? null : { message: 'Not found' } }),
      }
    }
    if (table === 'machine_overviews') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: overviewRow, error: null }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      }
    }
    if (table === 'machine_chunks') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: chunksData, error: null }),
      }
    }
    return {}
  })
  return { from: fromMock }
}

describe('getOrGenerateOverview', () => {
  it('returns cached overview when pdf_hash matches', async () => {
    const supabase = makeSupabase(
      { pdf_hash: 'abc123', name: 'Máquina A' },
      { content: 'Overview cacheado', pdf_hash: 'abc123' },
      []
    )
    const result = await getOrGenerateOverview(supabase, 'machine-1')
    expect(result).toBe('Overview cacheado')
  })

  it('generates and caches overview when hash differs', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Overview gerado' }],
    })
    ;(Anthropic as jest.Mock).mockImplementation(() => ({ messages: { create: mockCreate } }))

    const supabase = makeSupabase(
      { pdf_hash: 'newHash', name: 'Máquina A' },
      { content: 'Old overview', pdf_hash: 'oldHash' },
      [{ content: 'chunk 1' }, { content: 'chunk 2' }]
    )

    const result = await getOrGenerateOverview(supabase, 'machine-1')
    expect(result).toBe('Overview gerado')
    expect(mockCreate).toHaveBeenCalled()
  })

  it('throws when machine has no pdf_hash', async () => {
    const supabase = makeSupabase({ pdf_hash: null, name: 'Máquina A' }, null, [])
    await expect(getOrGenerateOverview(supabase, 'machine-1')).rejects.toThrow(
      'Manual não indexado para esta máquina'
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="rag.overview" --no-coverage
```

Expected: FAIL — `Cannot find module '@/services/rag.overview.service'`

- [ ] **Step 3: Implement `rag.overview.service.ts`**

Create `src/services/rag.overview.service.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

export async function getOrGenerateOverview(
  supabase: SupabaseClient,
  machineId: string
): Promise<string> {
  const { data: machine, error: mErr } = await supabase
    .from('machines')
    .select('pdf_hash, name')
    .eq('id', machineId)
    .single()
  if (mErr || !machine) throw new Error('Máquina não encontrada')
  if (!machine.pdf_hash) throw new Error('Manual não indexado para esta máquina')

  const { data: cached } = await supabase
    .from('machine_overviews')
    .select('content, pdf_hash')
    .eq('machine_id', machineId)
    .single()

  if (cached && cached.pdf_hash === machine.pdf_hash) return cached.content

  const { data: chunks, error: cErr } = await supabase
    .from('machine_chunks')
    .select('content')
    .eq('machine_id', machineId)
    .order('chunk_index', { ascending: true })
    .limit(20)
  if (cErr || !chunks?.length) throw new Error('Nenhum chunk encontrado para esta máquina')

  const context = (chunks as { content: string }[]).map((c) => c.content).join('\n\n---\n\n')

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: `Você é um assistente técnico especializado. Gere um overview estruturado do manual da máquina "${machine.name}" com as seções: **Especificações Principais**, **Manutenção Preventiva**, **Alertas de Segurança**, **Orientações do Fabricante**. Use apenas as informações do contexto fornecido.`,
    messages: [{ role: 'user', content: `Contexto do manual:\n${context}\n\nGere o overview estruturado.` }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response from Claude')
  const content = block.text

  await supabase.from('machine_overviews').upsert(
    { machine_id: machineId, content, pdf_hash: machine.pdf_hash, generated_at: new Date().toISOString() },
    { onConflict: 'machine_id' }
  )

  return content
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="rag.overview" --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C "sr-energy-back/sr-energy-api" add src/services/rag.overview.service.ts tests/services/rag.overview.service.test.ts
git -C "sr-energy-back/sr-energy-api" commit -m "feat(rag): add rag.overview.service with cache-aware generation"
```

---

## Task 5: Modify `answerQuestion` to check curated first

**Files:**
- Modify: `sr-energy-back/sr-energy-api/src/services/rag.service.ts`
- Modify: `sr-energy-back/sr-energy-api/tests/services/rag.service.test.ts`

- [ ] **Step 1: Write the failing test**

Add to the existing `describe` block or add a new one in `tests/services/rag.service.test.ts`:

```typescript
import { findCuratedAnswer } from '@/services/rag.curated.service'

jest.mock('@/services/rag.curated.service')

describe('answerQuestion — curated hit', () => {
  it('returns curated answer without calling Claude when similarity > 0.92', async () => {
    const fakeEmbedding = Array(1024).fill(0.1)
    const mockVoyage = { embed: jest.fn().mockResolvedValue({ data: [{ embedding: fakeEmbedding }] }) }
    ;(VoyageAIClient as jest.Mock).mockImplementation(() => mockVoyage)

    jest.mocked(findCuratedAnswer).mockResolvedValue('Resposta curada')

    const mockSupabase: any = { rpc: jest.fn() }
    const result = await ragService.answerQuestion(mockSupabase, 'machine-1', 'Pergunta?')

    expect(result).toBe('Resposta curada')
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="rag.service" --no-coverage
```

Expected: FAIL — curated is not checked, result differs

- [ ] **Step 3: Update `answerQuestion` in `rag.service.ts`**

Replace the current `answerQuestion` function:

```typescript
import { findCuratedAnswer } from '@/services/rag.curated.service'

export async function answerQuestion(
  supabase: SupabaseClient,
  machineId: string,
  question: string
): Promise<string> {
  // 1. Embed the question first (reused for both curated check and RAG)
  const [queryEmbedding] = await embedTexts([question])

  // 2. Check curated answers — return immediately if hit
  const curated = await findCuratedAnswer(supabase, machineId, queryEmbedding)
  if (curated) return curated

  // 3. Vector search for relevant chunks
  const { data: chunks, error } = await supabase.rpc('match_machine_chunks', {
    p_machine_id: machineId,
    p_embedding: queryEmbedding,
    p_limit: 5,
  })
  if (error) throw new Error(`Vector search failed: ${error.message}`)
  if (!chunks || chunks.length === 0)
    throw new Error('Manual não indexado para esta máquina')

  const context = (chunks as { content: string }[]).map((c) => c.content).join('\n\n---\n\n')

  // 4. Call Claude
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: `Você é um assistente técnico especializado. Responda APENAS com base no contexto do manual fornecido. Se a resposta não estiver no contexto, diga "Não encontrei essa informação no manual."`,
    messages: [
      { role: 'user', content: `Contexto do manual:\n${context}\n\nPergunta: ${question}` },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}
```

- [ ] **Step 4: Run all rag.service tests**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="rag.service" --no-coverage
```

Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git -C "sr-energy-back/sr-energy-api" add src/services/rag.service.ts tests/services/rag.service.test.ts
git -C "sr-energy-back/sr-energy-api" commit -m "feat(rag): answerQuestion checks curated answers before calling Claude"
```

---

## Task 6: Extend `chat.ts` routes — compare, curate, delete

**Files:**
- Modify: `sr-energy-back/sr-energy-api/src/routes/chat.ts`
- Modify: `sr-energy-back/sr-energy-api/tests/routes/chat.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/routes/chat.test.ts`:

```typescript
import * as curatedService from '@/services/rag.curated.service'
import * as ragService from '@/services/rag.service'

jest.mock('@/services/rag.curated.service')

const admin = JSON.stringify({ id: 'admin-1', role: 'admin', name: 'Admin', email: 'a@sr.com' })
const emp   = JSON.stringify({ id: 'user-1', role: 'employee', name: 'João', email: 'j@sr.com' })

describe('POST /chat/compare', () => {
  it('returns comparative answer', async () => {
    const app = buildApp()
    app.register(chatRoute, { prefix: '/chat' })
    await app.ready()

    jest.mocked(ragService.compareAcrossMachines).mockResolvedValue('Máquina A é mais eficiente.')

    const res = await app.inject({
      method: 'POST', url: '/chat/compare',
      headers: { 'x-test-user': emp, 'content-type': 'application/json' },
      payload: { machineIds: ['m1', 'm2'], message: 'Qual é mais eficiente?' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().answer).toBe('Máquina A é mais eficiente.')
  })

  it('returns 400 when fewer than 2 machineIds', async () => {
    const app = buildApp()
    app.register(chatRoute, { prefix: '/chat' })
    await app.ready()
    const res = await app.inject({
      method: 'POST', url: '/chat/compare',
      headers: { 'x-test-user': emp, 'content-type': 'application/json' },
      payload: { machineIds: ['m1'], message: 'Pergunta?' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /chat/curate', () => {
  it('saves curated answer and returns 201', async () => {
    const app = buildApp()
    app.register(chatRoute, { prefix: '/chat' })
    await app.ready()

    jest.mocked(ragService.embedTexts).mockResolvedValue([Array(1024).fill(0.1)])
    jest.mocked(curatedService.saveCuratedAnswer).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'POST', url: '/chat/curate',
      headers: { 'x-test-user': emp, 'content-type': 'application/json' },
      payload: { machineId: 'machine-1', question: 'Pergunta?', answer: 'Resposta.' },
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('DELETE /chat/curate/:id', () => {
  it('deletes curated answer as admin', async () => {
    const app = buildApp()
    app.register(chatRoute, { prefix: '/chat' })
    await app.ready()

    jest.mocked(curatedService.deleteCuratedAnswer).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE', url: '/chat/curate/answer-1',
      headers: { 'x-test-user': admin },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 for non-admin', async () => {
    const app = buildApp()
    app.register(chatRoute, { prefix: '/chat' })
    await app.ready()

    const res = await app.inject({
      method: 'DELETE', url: '/chat/curate/answer-1',
      headers: { 'x-test-user': emp },
    })
    expect(res.statusCode).toBe(403)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="routes/chat" --no-coverage
```

Expected: FAIL — routes not defined yet

- [ ] **Step 3: Rewrite `chat.ts`**

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { answerQuestion, compareAcrossMachines, embedTexts } from '@/services/rag.service'
import { saveCuratedAnswer, deleteCuratedAnswer } from '@/services/rag.curated.service'

const chatBody = z.object({
  machineId: z.string().min(1, 'Selecione uma máquina'),
  message: z.string().min(1, 'Mensagem não pode estar vazia'),
})

const compareBody = z.object({
  machineIds: z.array(z.string().min(1)).min(2, 'Selecione ao menos 2 máquinas'),
  message: z.string().min(1, 'Mensagem não pode estar vazia'),
})

const curateBody = z.object({
  machineId: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
})

const chat: FastifyPluginAsync = async (fastify) => {
  const guard = (fastify as any).authenticate

  fastify.post('/', { onRequest: [guard] }, async (req, reply) => {
    const parsed = chatBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    try {
      const answer = await answerQuestion(fastify.supabase, parsed.data.machineId, parsed.data.message)
      return { answer }
    } catch (err: any) {
      if (err.message?.includes('não indexado')) return reply.status(404).send({ error: err.message })
      return reply.status(502).send({ error: 'Erro ao consultar a IA. Tente novamente.' })
    }
  })

  fastify.post('/compare', { onRequest: [guard] }, async (req, reply) => {
    const parsed = compareBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    try {
      const answer = await compareAcrossMachines(fastify.supabase, parsed.data.machineIds, parsed.data.message)
      return { answer }
    } catch (err: any) {
      return reply.status(502).send({ error: 'Erro ao consultar a IA. Tente novamente.' })
    }
  })

  fastify.post('/curate', { onRequest: [guard] }, async (req: any, reply) => {
    const parsed = curateBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    try {
      const [questionEmbedding] = await embedTexts([parsed.data.question])
      await saveCuratedAnswer(
        fastify.supabase,
        parsed.data.machineId,
        parsed.data.question,
        questionEmbedding,
        parsed.data.answer,
        req.user.id
      )
      return reply.status(201).send({ ok: true })
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao salvar resposta.' })
    }
  })

  fastify.delete<{ Params: { id: string } }>('/curate/:id', { onRequest: [guard] }, async (req: any, reply) => {
    if (req.user.role !== 'admin') return reply.status(403).send({ error: 'Acesso negado' })
    try {
      await deleteCuratedAnswer(fastify.supabase, req.params.id)
      return reply.status(204).send()
    } catch (err: any) {
      return reply.status(500).send({ error: 'Erro ao remover resposta.' })
    }
  })
}

export default chat
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="routes/chat" --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C "sr-energy-back/sr-energy-api" add src/routes/chat.ts tests/routes/chat.test.ts
git -C "sr-energy-back/sr-energy-api" commit -m "feat(routes): add /chat/compare, /chat/curate, DELETE /chat/curate/:id"
```

---

## Task 7: Extend `machines.ts` — overview route + pdf_hash on upload

**Files:**
- Modify: `sr-energy-back/sr-energy-api/src/routes/machines.ts`
- Modify: `sr-energy-back/sr-energy-api/tests/routes/machines.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/routes/machines.test.ts`:

```typescript
import * as overviewService from '@/services/rag.overview.service'
jest.mock('@/services/rag.overview.service')

const emp = JSON.stringify({ id: 'user-1', role: 'employee', name: 'João', email: 'j@sr.com' })

describe('GET /machines/:id/overview', () => {
  it('returns cached overview', async () => {
    const app = buildApp()
    app.register(machinesRoute, { prefix: '/machines' })
    await app.ready()

    jest.mocked(overviewService.getOrGenerateOverview).mockResolvedValue('Overview da máquina.')

    const res = await app.inject({
      method: 'GET', url: '/machines/machine-1/overview',
      headers: { 'x-test-user': emp },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().overview).toBe('Overview da máquina.')
  })

  it('returns 404 when manual is not indexed', async () => {
    const app = buildApp()
    app.register(machinesRoute, { prefix: '/machines' })
    await app.ready()

    jest.mocked(overviewService.getOrGenerateOverview).mockRejectedValue(
      new Error('Manual não indexado para esta máquina')
    )

    const res = await app.inject({
      method: 'GET', url: '/machines/machine-1/overview',
      headers: { 'x-test-user': emp },
    })
    expect(res.statusCode).toBe(404)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="routes/machines" --no-coverage
```

Expected: FAIL — route not defined

- [ ] **Step 3: Add admin guard test for `POST /machines/:id/manual`**

Add to `tests/routes/machines.test.ts`:

```typescript
describe('POST /machines/:id/manual — admin guard', () => {
  it('returns 403 for employee role', async () => {
    const app = buildApp()
    app.register(machinesRoute, { prefix: '/machines' })
    await app.ready()
    const res = await app.inject({
      method: 'POST', url: '/machines/machine-1/manual',
      headers: { 'x-test-user': emp, 'content-type': 'application/octet-stream' },
      payload: Buffer.from('%PDF-test'),
    })
    expect(res.statusCode).toBe(403)
  })
})
```

Run to verify it fails (guard not implemented yet):

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="routes/machines" --no-coverage
```

- [ ] **Step 4: Add overview route, pdf_hash, and admin guard to `machines.ts`**

Add this import at the top of `machines.ts`:

```typescript
import { createHash } from 'crypto'
import { getOrGenerateOverview } from '@/services/rag.overview.service'
```

Replace the existing `POST /:id/manual` handler with:

```typescript
fastify.post<{ Params: { id: string } }>('/:id/manual', { onRequest: [guard] }, async (req: any, reply) => {
  if (!['manager', 'admin'].includes(req.user.role))
    return reply.status(403).send({ error: 'Acesso negado' })
  const db = fastify.supabase
  const buffer = await req.file().then((f: any) => f.toBuffer())
  const pdfHash = createHash('sha256').update(buffer).digest('hex')
  const url = await uploadFile(fastify.supabase, 'machine-manuals', `${req.params.id}.pdf`, buffer, 'application/pdf')
  await db
    .from('machines')
    .update({ manual_url: url, pdf_hash: pdfHash, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
  indexMachineManual(fastify.supabase, req.params.id, buffer).catch(console.error)
  return { url }
})
```

Add the overview route after the manual upload route:

```typescript
fastify.get<{ Params: { id: string } }>('/:id/overview', { onRequest: [guard] }, async (req, reply) => {
  try {
    const overview = await getOrGenerateOverview(fastify.supabase, req.params.id)
    return { overview }
  } catch (err: any) {
    if (err.message?.includes('não indexado')) return reply.status(404).send({ error: err.message })
    return reply.status(502).send({ error: 'Erro ao gerar overview. Tente novamente.' })
  }
})
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd "sr-energy-back/sr-energy-api" && npm test -- --testPathPattern="routes/machines" --no-coverage
```

Expected: PASS

- [ ] **Step 6: Run the full backend test suite**

```bash
cd "sr-energy-back/sr-energy-api" && npm test --no-coverage
```

Expected: all tests green

- [ ] **Step 7: Commit**

```bash
git -C "sr-energy-back/sr-energy-api" add src/routes/machines.ts tests/routes/machines.test.ts
git -C "sr-energy-back/sr-energy-api" commit -m "feat(routes): add GET /machines/:id/overview, pdf_hash on upload, admin guard"
```

---

## Task 8: Frontend — models, services, machine overview service

**Files:**
- Modify: `sr-energy-front/src/models/chat.model.ts`
- Modify: `sr-energy-front/src/services/chat.service.ts`
- Modify: `sr-energy-front/src/services/machine.service.ts`

No dedicated test file for services — they are thin wrappers over `api`; the viewmodel tests cover the behavior.

- [ ] **Step 1: Add types to `chat.model.ts`**

Append to the end of `src/models/chat.model.ts`:

```typescript
export interface CuratedAnswer {
  id: string
  machineId: string
  question: string
  answer: string
  createdBy: string
  createdAt: string
}

export interface CompareRequest {
  machineIds: string[]
  message: string
}
```

- [ ] **Step 2: Add functions to `chat.service.ts`**

Append to the end of `src/services/chat.service.ts`:

```typescript
export async function compareQuery(machineIds: string[], message: string): Promise<string> {
  const { data } = await api.post<{ answer: string }>('/chat/compare', { machineIds, message })
  return data.answer
}

export async function saveCuratedAnswer(
  machineId: string,
  question: string,
  answer: string
): Promise<void> {
  await api.post('/chat/curate', { machineId, question, answer })
}

export async function deleteCuratedAnswer(id: string): Promise<void> {
  await api.delete(`/chat/curate/${id}`)
}
```

- [ ] **Step 3: Add `getMachineOverview` to `machine.service.ts`**

Append to the end of `src/services/machine.service.ts`:

```typescript
export async function getMachineOverview(id: string): Promise<string> {
  const { data } = await api.get<{ overview: string }>(`/machines/${id}/overview`)
  return data.overview
}
```

- [ ] **Step 4: Commit**

```bash
git -C "sr-energy-front" add src/models/chat.model.ts src/services/chat.service.ts src/services/machine.service.ts
git -C "sr-energy-front" commit -m "feat(chat): add CuratedAnswer/CompareRequest types and service functions"
```

---

## Task 9: Frontend — `chat.viewmodel.ts` — compare mode + curateAnswer

**Files:**
- Modify: `sr-energy-front/src/viewmodels/chat.viewmodel.ts`
- Modify: `sr-energy-front/src/__tests__/viewmodels/chat.viewmodel.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/__tests__/viewmodels/chat.viewmodel.test.ts`:

```typescript
import { act, renderHook } from '@testing-library/react'
import { useChatStore } from '@/viewmodels/chat.viewmodel'
import * as chatService from '@/services/chat.service'

jest.mock('@/services/chat.service')

describe('useChatStore — compare mode', () => {
  beforeEach(() => useChatStore.setState({
    messages: [], loading: false, error: null,
    machineId: '', compareMode: false, selectedMachines: [],
  }))

  it('setCompareMode toggles compareMode', () => {
    const { result } = renderHook(() => useChatStore())
    act(() => result.current.setCompareMode(true))
    expect(result.current.compareMode).toBe(true)
  })

  it('toggleSelectedMachine adds and removes machine ids', () => {
    const { result } = renderHook(() => useChatStore())
    act(() => result.current.toggleSelectedMachine('m1'))
    expect(result.current.selectedMachines).toContain('m1')
    act(() => result.current.toggleSelectedMachine('m1'))
    expect(result.current.selectedMachines).not.toContain('m1')
  })

  it('sendMessage uses compareQuery when compareMode is true', async () => {
    jest.mocked(chatService.compareQuery).mockResolvedValue('Resposta comparativa')
    const { result } = renderHook(() => useChatStore())
    act(() => {
      result.current.setCompareMode(true)
      result.current.toggleSelectedMachine('m1')
      result.current.toggleSelectedMachine('m2')
    })
    await act(() => result.current.sendMessage('Qual é melhor?'))
    const last = result.current.messages.at(-1)!
    expect(last.role).toBe('assistant')
    expect(last.content).toBe('Resposta comparativa')
    expect(chatService.compareQuery).toHaveBeenCalledWith(['m1', 'm2'], 'Qual é melhor?')
  })
})

describe('useChatStore — curateAnswer', () => {
  it('calls saveCuratedAnswer with the question and answer pair', async () => {
    jest.mocked(chatService.saveCuratedAnswer).mockResolvedValue(undefined)
    const { result } = renderHook(() => useChatStore())
    act(() => {
      useChatStore.setState({
        machineId: 'machine-1',
        messages: [
          { id: '1', role: 'user', content: 'Pergunta?', timestamp: '' },
          { id: '2', role: 'assistant', content: 'Resposta.', timestamp: '' },
        ],
      })
    })
    await act(() => result.current.curateAnswer(1))
    expect(chatService.saveCuratedAnswer).toHaveBeenCalledWith('machine-1', 'Pergunta?', 'Resposta.')
  })

  it('does nothing if msgIndex does not point to an assistant message', async () => {
    jest.mocked(chatService.saveCuratedAnswer).mockResolvedValue(undefined)
    const { result } = renderHook(() => useChatStore())
    act(() => {
      useChatStore.setState({
        machineId: 'machine-1',
        messages: [{ id: '1', role: 'user', content: 'Pergunta?', timestamp: '' }],
      })
    })
    await act(() => result.current.curateAnswer(0))
    expect(chatService.saveCuratedAnswer).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "sr-energy-front" && npm test -- --testPathPattern="chat.viewmodel" --no-coverage --watchAll=false
```

Expected: FAIL — `setCompareMode is not a function`, `curateAnswer is not a function`

- [ ] **Step 3: Update `chat.viewmodel.ts`**

Replace the full file with:

```typescript
import { create } from 'zustand'
import type { ChatMessage } from '@/models/chat.model'
import { sendMessage, compareQuery, saveCuratedAnswer } from '@/services/chat.service'

function makeId() {
  return Math.random().toString(36).slice(2)
}

interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  machineId: string
  compareMode: boolean
  selectedMachines: string[]

  setMachineId: (id: string) => void
  setCompareMode: (enabled: boolean) => void
  toggleSelectedMachine: (id: string) => void
  sendMessage: (content: string) => Promise<void>
  curateAnswer: (msgIndex: number) => Promise<void>
  retryLastMessage: () => Promise<void>
  clear: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  machineId: '',
  compareMode: false,
  selectedMachines: [],

  setMachineId: (id) => set({ machineId: id, messages: [], error: null }),

  setCompareMode: (enabled) => set({ compareMode: enabled, selectedMachines: [], messages: [], error: null }),

  toggleSelectedMachine: (id) =>
    set((s) => ({
      selectedMachines: s.selectedMachines.includes(id)
        ? s.selectedMachines.filter((m) => m !== id)
        : [...s.selectedMachines, id],
    })),

  sendMessage: async (content) => {
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content, timestamp: new Date().toISOString() }
    set((s) => ({ messages: [...s.messages, userMsg], loading: true, error: null }))
    try {
      const { machineId, compareMode, selectedMachines } = get()
      const answer = compareMode
        ? await compareQuery(selectedMachines, content)
        : await sendMessage(machineId, content)
      const assistantMsg: ChatMessage = { id: makeId(), role: 'assistant', content: answer, timestamp: new Date().toISOString() }
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      throw err
    }
  },

  curateAnswer: async (msgIndex) => {
    const { messages, machineId } = get()
    const assistantMsg = messages[msgIndex]
    const userMsg = messages[msgIndex - 1]
    if (!assistantMsg || assistantMsg.role !== 'assistant') return
    if (!userMsg || userMsg.role !== 'user') return
    await saveCuratedAnswer(machineId, userMsg.content, assistantMsg.content)
  },

  retryLastMessage: async () => {
    const { messages, machineId } = get()
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    set({ error: null })
    try {
      const answer = await sendMessage(machineId, lastUser.content)
      const assistantMsg: ChatMessage = { id: makeId(), role: 'assistant', content: answer, timestamp: new Date().toISOString() }
      set((s) => ({ messages: [...s.messages, assistantMsg], loading: false }))
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  clear: () => set({ messages: [], error: null }),
}))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "sr-energy-front" && npm test -- --testPathPattern="chat.viewmodel" --no-coverage --watchAll=false
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C "sr-energy-front" add src/viewmodels/chat.viewmodel.ts src/__tests__/viewmodels/chat.viewmodel.test.ts
git -C "sr-energy-front" commit -m "feat(chat): add compareMode, selectedMachines, curateAnswer to chat store"
```

---

## Task 10: Frontend — `ChatMessage.tsx` component

**Files:**
- Create: `sr-energy-front/src/views/components/ChatMessage.tsx`
- Create: `sr-energy-front/src/__tests__/views/ChatMessage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/views/ChatMessage.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatMessage } from '@/views/components/ChatMessage'
import type { ChatMessage as ChatMessageType } from '@/models/chat.model'

const userMsg: ChatMessageType = { id: '1', role: 'user', content: 'Minha pergunta', timestamp: '' }
const assistantMsg: ChatMessageType = { id: '2', role: 'assistant', content: 'Minha resposta', timestamp: '' }

describe('ChatMessage', () => {
  it('renders user message content', () => {
    render(<ChatMessage message={userMsg} />)
    expect(screen.getByText('Minha pergunta')).toBeInTheDocument()
  })

  it('does not show thumbs-up for user messages', () => {
    render(<ChatMessage message={userMsg} onCurate={jest.fn()} />)
    expect(screen.queryByTitle('Marcar como resposta correta')).not.toBeInTheDocument()
  })

  it('shows thumbs-up button for assistant messages when onCurate is provided', () => {
    render(<ChatMessage message={assistantMsg} onCurate={jest.fn()} />)
    expect(screen.getByTitle('Marcar como resposta correta')).toBeInTheDocument()
  })

  it('calls onCurate when thumbs-up is clicked', () => {
    const onCurate = jest.fn()
    render(<ChatMessage message={assistantMsg} onCurate={onCurate} />)
    fireEvent.click(screen.getByTitle('Marcar como resposta correta'))
    expect(onCurate).toHaveBeenCalledTimes(1)
  })

  it('does not show thumbs-up when onCurate is not provided', () => {
    render(<ChatMessage message={assistantMsg} />)
    expect(screen.queryByTitle('Marcar como resposta correta')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "sr-energy-front" && npm test -- --testPathPattern="ChatMessage" --no-coverage --watchAll=false
```

Expected: FAIL — `Cannot find module '@/views/components/ChatMessage'`

- [ ] **Step 3: Implement `ChatMessage.tsx`**

Create `src/views/components/ChatMessage.tsx`:

```tsx
import type { ChatMessage as ChatMessageType } from '@/models/chat.model'

interface Props {
  message: ChatMessageType
  onCurate?: () => void
}

export function ChatMessage({ message, onCurate }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {!isUser && onCurate && (
          <button
            onClick={onCurate}
            className="btn btn-ghost btn-xs mt-1 text-success"
            title="Marcar como resposta correta"
            type="button"
          >
            👍
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "sr-energy-front" && npm test -- --testPathPattern="ChatMessage" --no-coverage --watchAll=false
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git -C "sr-energy-front" add src/views/components/ChatMessage.tsx src/__tests__/views/ChatMessage.test.tsx
git -C "sr-energy-front" commit -m "feat(chat): add ChatMessage component with thumbs-up curation button"
```

---

## Task 11: Frontend — `MachineOverview.tsx` component

**Files:**
- Create: `sr-energy-front/src/views/components/MachineOverview.tsx`
- Create: `sr-energy-front/src/__tests__/views/MachineOverview.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/views/MachineOverview.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { MachineOverview } from '@/views/components/MachineOverview'
import * as machineService from '@/services/machine.service'

jest.mock('@/services/machine.service')

describe('MachineOverview', () => {
  it('shows skeleton while loading', () => {
    jest.mocked(machineService.getMachineOverview).mockReturnValue(new Promise(() => {}))
    const { container } = render(<MachineOverview machineId="machine-1" />)
    expect(container.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('renders overview content after loading', async () => {
    jest.mocked(machineService.getMachineOverview).mockResolvedValue('**Specs:** Pressão 200 bar')
    render(<MachineOverview machineId="machine-1" />)
    await waitFor(() => expect(screen.getByText(/Pressão 200 bar/)).toBeInTheDocument())
  })

  it('shows error message when fetch fails', async () => {
    jest.mocked(machineService.getMachineOverview).mockRejectedValue(
      new Error('Manual não indexado para esta máquina')
    )
    render(<MachineOverview machineId="machine-1" />)
    await waitFor(() =>
      expect(screen.getByText(/Manual não indexado/)).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "sr-energy-front" && npm test -- --testPathPattern="MachineOverview" --no-coverage --watchAll=false
```

Expected: FAIL — `Cannot find module '@/views/components/MachineOverview'`

- [ ] **Step 3: Implement `MachineOverview.tsx`**

Create `src/views/components/MachineOverview.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { getMachineOverview } from '@/services/machine.service'

interface Props {
  machineId: string
}

export function MachineOverview({ machineId }: Props) {
  const [overview, setOverview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMachineOverview(machineId)
      .then(setOverview)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [machineId])

  if (loading) return <div className="skeleton h-32 w-full rounded-lg" />
  if (error) return <p className="text-error text-sm">{error}</p>
  if (!overview) return null

  return (
    <div className="prose prose-sm max-w-none">
      {overview.split('\n').map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "sr-energy-front" && npm test -- --testPathPattern="MachineOverview" --no-coverage --watchAll=false
```

Expected: PASS

- [ ] **Step 5: Run the full frontend test suite**

```bash
cd "sr-energy-front" && npm test --no-coverage --watchAll=false
```

Expected: all tests green

- [ ] **Step 6: Commit**

```bash
git -C "sr-energy-front" add src/views/components/MachineOverview.tsx src/__tests__/views/MachineOverview.test.tsx
git -C "sr-energy-front" commit -m "feat(machine): add MachineOverview component with loading/error states"
```

---

## Final Verification

- [ ] Run full backend suite: `cd "sr-energy-back/sr-energy-api" && npm test --no-coverage`
- [ ] Run full frontend suite: `cd "sr-energy-front" && npm test --no-coverage --watchAll=false`
- [ ] Smoke-test manually: upload a PDF → ask a question → thumbs up → ask the same question again (should return curated) → ask for overview → switch to compare mode and ask a question across 2 machines
