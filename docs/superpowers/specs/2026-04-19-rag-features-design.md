# RAG Features Design
**Date:** 2026-04-19  
**Status:** Approved  
**Scope:** Full-stack (sr-energy-back + sr-energy-front)

## Context

The project already has a functional RAG pipeline:
- `rag.service.ts` — PDF extraction, chunking (500 chars / 50 overlap), Voyage AI embeddings, pgvector similarity search, Claude answering
- `machine_chunks` table with IVFFlat index
- `POST /chat` route — single-machine Q&A
- Frontend `chat.service.ts` / `chat.viewmodel.ts` / `chat.model.ts`
- PDF upload fully wired (form → `POST /machines/:id/manual` → storage + async indexing)

**Gap:** The `match_machine_chunks` RPC function referenced in `rag.service.ts` does not exist in any migration yet — must be created.

## Features to Build

### 1. Curated Answers
Any authenticated user can mark an AI answer as correct via a thumbs-up icon on the chat message. The Q&A pair is saved immediately (pre-approved = always true). Admins can delete incorrect entries. On the next similar question (cosine similarity > 0.92), the curated answer is returned directly without calling Claude.

### 2. Multi-Machine Comparison
User selects 2+ machines in the chat UI and asks a free-form question. The backend runs vector search across all selected machines simultaneously, builds a per-machine context block, and sends a single prompt to Claude requesting a comparative answer.

### 3. Machine Overview (cached)
When a user asks for an overview in the chat (e.g., "me dê um overview", "resumo geral"), the backend checks for a cached overview tied to the current PDF hash. If valid, returns it immediately. Otherwise, generates a structured overview (maintenance schedule, key specs, safety alerts, manufacturer guidelines) using Claude with the top-20 chunks, stores it, and returns. Cache is invalidated when a new PDF is uploaded (new hash).

## Database — Migration 011

### New RPC: `match_machine_chunks`
```sql
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
```

### New RPC: `match_chunks_multi_machine`
```sql
CREATE OR REPLACE FUNCTION match_chunks_multi_machine(
  p_machine_ids uuid[],
  p_embedding   vector(1024),
  p_limit       int DEFAULT 5
)
RETURNS TABLE(machine_id uuid, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT machine_id,
         content,
         1 - (embedding <=> p_embedding) AS similarity
  FROM machine_chunks
  WHERE machine_id = ANY(p_machine_ids)
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit * array_length(p_machine_ids, 1);
$$;
```

### New Table: `rag_curated_answers`
```sql
CREATE TABLE rag_curated_answers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  question   text NOT NULL,
  answer     text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON rag_curated_answers(machine_id);
```

### New Table: `machine_overviews`
```sql
CREATE TABLE machine_overviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id   uuid NOT NULL UNIQUE REFERENCES machines(id) ON DELETE CASCADE,
  content      text NOT NULL,
  pdf_hash     text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
```

### Hash on machines table
```sql
ALTER TABLE machines ADD COLUMN pdf_hash text;
```
Populated during `POST /machines/:id/manual` upload.

## Backend Architecture

### `rag.curated.service.ts` (new)
- `findCuratedAnswer(supabase, machineId, question, queryEmbedding)` — fetches all curated Q embeddings for the machine, returns the answer if cosine similarity > 0.92, else null
- `saveCuratedAnswer(supabase, machineId, question, answer, userId)` — inserts row
- `deleteCuratedAnswer(supabase, id)` — deletes row (admin only, enforced at route level)

### `rag.overview.service.ts` (new)
- `getOrGenerateOverview(supabase, machineId)` — checks `machine_overviews` for machine; fetches current `pdf_hash` from `machines`; returns cached if hash matches; otherwise generates via Claude with top-20 chunks and upserts cache

### `rag.service.ts` (modified)
- `answerQuestion`: before embedding the question, calls `findCuratedAnswer`; if hit, returns curated answer directly
- `indexMachineManual`: accepts optional `pdfHash` param and stores it in `machines.pdf_hash`; invalidates `machine_overviews` for the machine

### Routes

**`chat.ts`** (extended):
- `POST /chat` — unchanged interface, internally checks curated first
- `POST /chat/compare` — body: `{ machineIds: string[], message: string }` → calls new `compareAcrossMachines()`
- `POST /chat/curate` — body: `{ machineId, question, answer }` → calls `saveCuratedAnswer`; auth required
- `DELETE /chat/curate/:id` — admin role required

**`machines.ts`** (extended):
- `GET /machines/:id/overview` — calls `getOrGenerateOverview`; 404 if no chunks exist

## Data Flow

```
Chat (single machine)
  POST /chat { machineId, message }
    → findCuratedAnswer (similarity > 0.92?) → return curated
    → embedQuestion → match_machine_chunks (top-5) → Claude → return
    [thumbs up in UI] → POST /chat/curate → saveCuratedAnswer

Chat (comparison)
  POST /chat/compare { machineIds, message }
    → embedQuestion → match_chunks_multi_machine
    → group chunks by machineId → build per-machine context blocks
    → Claude with comparative prompt → return

Overview
  GET /machines/:id/overview
    → fetch machine.pdf_hash + machine_overviews row
    → hash match? → return cached content
    → fetch top-20 chunks → Claude structured prompt → upsert cache → return
```

## Error Handling

| Scenario | Backend | Frontend |
|---|---|---|
| Manual not indexed | 404 `"Manual não indexado para esta máquina"` | Toast + disable chat input |
| One machine in compare has no manual | Partial answer noting which machines had no data | Warning badge on response |
| Claude/Voyage API failure | 502 `"Erro ao consultar a IA. Tente novamente."` | Error toast, retry button |
| Overview with no chunks | 404 `"Manual não indexado"` | Suggest uploading manual |
| Curate save fails | 500 | Silent fail (thumbs up reverts) |

## Frontend Components

### Modified
- `chat.service.ts` — add `compareQuery(machineIds, message)`, `saveCuratedAnswer(machineId, question, answer)`, `deleteCuratedAnswer(id)`, `getMachineOverview(machineId)`
- `chat.model.ts` — add `CompareRequest`, `CuratedAnswer` types
- `chat.viewmodel.ts` — add `compareMode: boolean`, `selectedMachines: string[]`, `curateAnswer(msgIndex)` action
- `machine.service.ts` — add `getMachineOverview(id)`

### New
- `ChatMessage.tsx` — renders a single chat bubble with thumbs-up icon for assistant messages
- `MachineOverview.tsx` — displays cached overview in the machine detail page, with "Gerar overview" fallback button if none exists

### Machine chat page
- Multi-machine selector toggle: when enabled, replaces single `machineId` with multi-select; routes to `compareQuery` instead of `sendMessage`

## Testing

Each new service function gets unit tests with Supabase client mocked. Route-level integration tests cover:
- Curated answer hit path (mock findCuratedAnswer returning a result)
- Curated answer miss path (falls through to RAG)
- Compare with 2 machines, one missing manual (partial response)
- Overview cache hit and cache miss paths

Frontend: `ChatMessage.test.tsx` covers thumbs-up interaction; `MachineOverview.test.tsx` covers loading/cached/empty states.

## Out of Scope
- Admin UI to list/manage curated answers (delete via API only for now)
- Automatic overview regeneration on schedule
- Conversation history persistence across sessions
