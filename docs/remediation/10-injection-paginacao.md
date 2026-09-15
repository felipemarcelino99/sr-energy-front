# 10 — Filter injection, paginação server-side e rate limits específicos

**Severidade:** 🟡 Média (injection: alta-média; paginação: escalabilidade)
**Repos:** sr-energy-api + sr-energy-front
**Esforço:** 6–10h • **Dependências:** 05 (recomendado), 09

## Problemas

1. **Filter injection** — `clients.ts:44`:
   `query.or(\`razao_social.ilike.%${search}%,cnpj.ilike.%${search}%\`)`interpola input do usuário na gramática de filtros do PostgREST. Com`,`, `(`, `)`
o usuário altera a estrutura lógica do filtro. Não é SQL injection plena, mas é
input não-sanitizado em linguagem de query. Verificar outras rotas com search
(`rg "\.or\(" src/routes`).
2. **Sem paginação no backend** — `GET /clients`, `/jobs`, `/employees`,
   `/transactions`, etc. retornam a tabela inteira. O `usePagination` do front é
   client-side: com volume real, payloads de MBs e render lento.
3. **Rate limit único** (100 req/min global em `app.ts`) — `/chat` consome tokens de
   IA pagos (Groq/Anthropic/Voyage) e merece limite próprio bem menor.

## Passos — Injection

### 1. (TDD) `tests/routes/clients.test.ts`

```ts
it('GET /clients?search= com metacaracteres não altera a lógica do filtro', async () => {
  const res = await inject({ url: '/clients?search=' + encodeURIComponent('x,cnpj.eq.123)') })
  expect(res.statusCode).toBe(200)        // não 500, não bypass
  // mock do supabase verifica que o termo foi escapado/limpo
})
it('GET /clients?search= limita tamanho do termo a 100 chars', ...)
```

### 2. Helper `src/utils/search.ts`

```ts
/** Remove metacaracteres da gramática de filtro PostgREST e curinga do LIKE. */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,().*%\\]/g, ' ') // metacaracteres de filtro + curingas LIKE
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}
```

Uso: `const term = sanitizeSearchTerm(search); if (term) query = query.or(\`razao_social.ilike.%${term}%,cnpj.ilike.%${term}%\`)`.
Aplicar em **todas** as rotas com search via `.or()`/interpolação.

## Passos — Paginação

### 3. Contrato

Resposta paginada padrão (rotas de listagem, começando por `jobs`, `clients`,
`transactions` — as de maior crescimento):

```
GET /clients?search=&page=1&limit=25
→ { "data": [...], "total": 132, "page": 1, "limit": 25 }
```

Regras: `limit` default 25, máx 100; `page` ≥ 1; **sem** params → comportamento
paginado com defaults (mudança de contrato controlada — ver sequência de deploy).

### 4. (TDD) Backend

```ts
it('GET /clients pagina com range e retorna total', async () => {
  // mock: .range(0, 24) chamado; count: 'exact'
})
it('GET /clients?limit=500 → capa em 100', ...)
```

Helper `src/utils/pagination.ts`:

```ts
const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export function parsePagination(q: unknown) {
  const { page, limit } = paginationQuery.parse(q)
  return { from: (page - 1) * limit, to: page * limit - 1, page, limit }
}
```

Na rota:

```ts
const { from, to, page, limit } = parsePagination(req.query)
const { data, error, count } = await db
  .from('clients')
  .select(SELECT_CLIENT, { count: 'exact' })
  .order('razao_social')
  .range(from, to)
return { data, total: count ?? 0, page, limit }
```

### 5. (TDD) Frontend

A mudança de shape (`Array` → `{ data, total, page, limit }`) afeta services e
viewmodels. Por domínio migrado:

- `client.model.ts`: `PaginatedResponseSchema(ClientSchema)` (genérico Zod).
- `client.service.ts`: aceita `{ page, limit, search }`, retorna `{ data, total }`.
- `client.viewmodel.ts`: estado `page/total`; trocar `usePagination` client-side pelo
  controle server-side (o componente `Pagination.tsx` já existe e recebe
  `totalPages` — reaproveitar).
- Testes de viewmodel e de página primeiro (mocks de service com shape novo).

### 6. Sequência de deploy

Para não quebrar o front em produção durante a transição, o backend pode aceitar
`?paginated=1` na primeira release (sem o flag, devolve array como hoje) e o front
migra domínio a domínio; release seguinte remove o flag e torna o shape paginado o
único. Alternativa mais simples se front+back deployam juntos: big-bang por rota,
um domínio por PR.

## Passos — Rate limits específicos

### 7. `/chat` (custo de IA)

```ts
// routes/chat.ts — por rota:
fastify.post('/', {
  onRequest: [guard],
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
}, ...)
// /compare e /curate: idem (5/min para compare, que consome 2+ máquinas)
```

Teste: 11ª chamada em 1min → 429. O login não passa pela API (Supabase Auth tem o
próprio rate limit — conferir os limites no dashboard).

> Nota de escala: o rate limit do `@fastify/rate-limit` é em memória por instância.
> Com 2+ réplicas atrás de load balancer ele se dilui — se/quando escalar
> horizontalmente, mover para store Redis **[REQUER APROVAÇÃO de dependência]**.

## Riscos e rollback

- **Injection fix:** risco ~zero (sanitização é restritiva; busca continua funcionando
  para termos normais: letras, números, espaços, `-`, `/`, `.` de CNPJ — atenção: o
  `.` é removido pelo regex acima; se busca por CNPJ formatado importa, normalizar o
  termo e a coluna removendo pontuação em vez de escapar).
- **Paginação:** principal risco é quebrar telas não migradas — mitigado pelo flag de
  transição e pela migração por domínio com e2e.
- Rollback: por rota/PR.

## Critérios de aceite

- [ ] Nenhuma interpolação de input em `.or()` sem `sanitizeSearchTerm`.
- [ ] `jobs`, `clients`, `transactions` paginados ponta a ponta (UI com `Pagination.tsx`).
- [ ] `limit` capado em 100 no servidor.
- [ ] `/chat*` com rate limit próprio; teste de 429 verde.
- [ ] Suites verdes nos dois repos; e2e das listagens migradas.
