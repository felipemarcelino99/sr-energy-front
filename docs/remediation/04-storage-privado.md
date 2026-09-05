# 04 — Storage privado + signed URLs para evidências

**Severidade:** 🔴 Crítica
**Repos:** sr-energy-api + sr-energy-front
**Esforço:** 4–8h • **Dependências:** 01

## Problema

`src/services/storage.service.ts` sobe evidências (fotos/vídeos/PDFs de serviços em
clientes) e retorna `getPublicUrl()` — o bucket `evidences` é público: **qualquer pessoa
com a URL acessa o arquivo sem autenticação**, para sempre. A URL fica persistida em
`evidences.url`.

Problemas acessórios no mesmo fluxo (`routes/reports.ts:60-74`):

- `file.filename` entra cru na key do storage (caracteres estranhos, path traversal).
- MIME type confiado do cliente, sem verificação de conteúdo.
- Sem verificação de ownership (tratada no plano 05).

## Estratégia

1. Bucket `evidences` → **privado**.
2. Banco passa a guardar o **path** do objeto (`storage_path`), não a URL.
3. A API gera **signed URLs com expiração** (1h) no momento da leitura
   (`GET /jobs/:id/report`).
4. Backfill dos registros existentes extraindo o path da URL pública antiga.

## Passos — Backend

### 1. (TDD) Testes primeiro em `tests/routes/reports.test.ts`

```ts
it('POST /reports/:id/evidences guarda storage_path e não URL pública', ...)
it('GET /jobs/:id/report retorna evidences com signed_url com expiração', ...)
it('rejeita filename com path traversal', async () => {
  // upload com filename '../../x.png' → key sanitizada, sem "/" extra
})
it('rejeita arquivo cujo magic byte não bate com o mimetype declarado', ...)
```

### 2. Migration `016_evidences_storage_path.sql`

```sql
ALTER TABLE evidences ADD COLUMN IF NOT EXISTS storage_path text;

-- Backfill: extrai o path da URL pública antiga
-- formato: https://<proj>.supabase.co/storage/v1/object/public/evidences/<path>
UPDATE evidences
SET storage_path = substring(url from '/object/public/evidences/(.*)$')
WHERE storage_path IS NULL AND url IS NOT NULL;

-- url vira legado; remover em migration futura após front migrado
```

### 3. Tornar o bucket privado

Via dashboard ou SQL:

```sql
UPDATE storage.buckets SET public = false WHERE id = 'evidences';
```

E conferir que não há policies de `storage.objects` dando SELECT a `anon`/`authenticated`
para esse bucket (a API usa service role).

### 4. Refatorar `storage.service.ts`

```ts
export async function uploadFile(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  // agora retorna o PATH
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: false }) // upsert:false — key tem timestamp
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  return path
}

const SIGNED_URL_TTL = 60 * 60 // 1h

export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL)
  if (error) throw new Error(`Signed URL failed: ${error.message}`)
  return data.signedUrl
}
```

### 5. Refatorar `routes/reports.ts`

Sanitização de filename + verificação de magic bytes (sem lib nova — assinaturas
simples dos 5 tipos já permitidos):

```ts
function sanitizeFilename(name: string): string {
  return name.replace(/[^\p{L}\p{N}._-]/gu, '_').slice(-100)
}

const MAGIC: Record<string, (b: Buffer) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8,
  'image/png': (b) =>
    b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'application/pdf': (b) => b.subarray(0, 5).toString() === '%PDF-',
  'video/mp4': (b) => b.subarray(4, 8).toString() === 'ftyp',
  'audio/mpeg': (b) =>
    (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) || b.subarray(0, 3).toString() === 'ID3',
}
```

No POST de evidência: validar mime na allowlist **e** `MAGIC[mime](buffer)`;
key = `${reportId}/${Date.now()}-${sanitizeFilename(file.filename)}`;
inserir `storage_path` em vez de `url`.

No GET do relatório: mapear evidences →
`{ ...ev, signed_url: await getSignedUrl(db, 'evidences', ev.storage_path) }`
(usar `Promise.all`; tolerar falha individual com `signed_url: null` + log).

## Passos — Frontend

### 6. (TDD) Atualizar testes de `JobReportView` e `EvidenceUpload`

- Modelo `Evidence` ganha `signedUrl` (o interceptor já converte `signed_url`).
- Componentes que renderizam `<img src>` / links passam a usar `signedUrl`.
- Caso `signedUrl === null` → placeholder "arquivo indisponível".

### 7. Implementar

Ajustar `job-report.model.ts` (schema Zod), `JobReportView.tsx`, `EvidenceUpload.tsx`.
Como a URL expira em 1h, **não cachear** a resposta do relatório além da sessão de
visualização; se o usuário deixar a tela aberta e o link expirar, o retry natural
(recarregar relatório) resolve — documentar no componente.

## Sequência de deploy (sem downtime)

1. Migration 016 (coluna + backfill) — `url` continua funcionando.
2. Deploy da API que escreve `storage_path` e retorna `signed_url` **e ainda** `url`.
3. Deploy do front consumindo `signedUrl` com fallback para `url`.
4. Tornar o bucket privado (a partir daqui `url` antiga morre — front já não a usa).
5. Migration futura: `ALTER TABLE evidences DROP COLUMN url`.

## Riscos e rollback

- **Risco:** links antigos compartilhados externamente quebram ao privar o bucket —
  é o comportamento desejado, mas comunicar.
- **Risco:** TTL de 1h curto para PDFs gerados (react-pdf usa as URLs?) — verificar
  `react-pdf-renderer` mock/uso; se o PDF embute imagens por URL, gerar o PDF logo
  após carregar o relatório.
- Rollback: repassar o bucket para público restaura o comportamento anterior sem
  alteração de código (o fallback `url` segue no banco até o passo 5).

## Critérios de aceite

- [ ] Bucket `evidences` privado; acesso anônimo a URL antiga retorna 400/403.
- [ ] Upload grava `storage_path`; leitura entrega `signed_url` expirável.
- [ ] Filename sanitizado; magic bytes validados; `upsert: false`.
- [ ] Evidências antigas (backfill) continuam visíveis no front.
- [ ] `npm test` verde nos dois repos + e2e do fluxo de finalização de job.
