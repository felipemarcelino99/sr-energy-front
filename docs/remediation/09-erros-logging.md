# 09 — Padronização de erros e logging

**Severidade:** 🟠 Alta (vazamento de informação) / 🟡 Média (consistência)
**Repo:** sr-energy-api
**Esforço:** 3–4h • **Dependências:** nenhuma (idealmente antes de 10)

## Problema

1. **Vazamento de detalhes internos:** o padrão
   `reply.status(500).send({ error: error.message })` repete-se em praticamente todas
   as rotas, expondo mensagens cruas do Postgres/PostgREST (nomes de tabelas,
   constraints, tipos). `chat.ts:62` devolve `err?.message` num 502.
   Irônico: `plugins/error-handler.ts` existe exatamente para impedir isso
   ("Nunca expor stack trace em produção"), mas as rotas o contornam tratando erro
   localmente.
2. **Logging inconsistente:** `console.error` em `chat.ts:56` em vez do pino
   estruturado (`req.log`); erros de banco engolidos sem log em várias rotas
   (o `error.message` ia para o cliente, não para o log).

## Estratégia

Inverter o fluxo: rotas **lançam** erros tipados; o error handler central loga o
detalhe e responde mensagem genérica. Um helper único elimina a repetição.

## Passos

### 1. Criar `src/utils/http-error.ts`

```ts
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public cause?: unknown
  ) {
    super(message)
  }
}

/** Converte erro do Supabase em HttpError 500 genérico, preservando o detalhe no cause. */
export function dbError(error: { message: string }): HttpError {
  return new HttpError(500, 'Erro interno do servidor', error)
}
```

### 2. (TDD) Testes do error handler e de rotas

`tests/plugins/error-handler.test.ts` (novo):

```ts
it('responde 500 genérico sem error.message do banco', async () => {
  // rota de teste que lança dbError({ message: 'relation "secret_table" does not exist' })
  const res = await app.inject({ url: '/boom' })
  expect(res.json()).toEqual({ error: 'Erro interno do servidor' })
  expect(res.payload).not.toContain('secret_table')
})
it('loga o cause com req.log.error', ...)
it('mantém details de validação zod em 400', ...)
```

Em cada teste de rota existente, adicionar assert de que a resposta 500 não contém
mensagem do mock de erro do Supabase.

### 3. Atualizar `plugins/error-handler.ts`

```ts
app.setErrorHandler((error: any, req, reply) => {
  req.log.error({ err: error.cause ?? error, url: req.url, method: req.method }, error.message)

  if (error.validation)
    return reply.code(400).send({ error: 'Dados inválidos', details: error.message })

  const status = error.statusCode ?? 500
  const SAFE: Record<number, string> = {
    400: 'Dados inválidos',
    401: 'Não autorizado',
    403: 'Acesso negado',
    404: 'Não encontrado',
    409: 'Conflito',
    429: 'Muitas requisições',
  }
  if (SAFE[status])
    return reply.code(status).send({ error: error.expose ? error.message : SAFE[status] })
  return reply.code(500).send({ error: 'Erro interno do servidor' })
})
```

(Decidir e documentar a convenção: mensagens 4xx criadas pela aplicação podem ser
expostas — ex. "Trabalho já cancelado" — usando um flag `expose`/subclasse;
mensagens herdadas de libs/banco nunca.)

### 4. Varredura e substituição nas rotas

```bash
rg "error\.message" src/routes src/services -n
```

Para cada ocorrência (estimativa: ~30 em 13 arquivos de rota):

```ts
// antes
if (error) return reply.status(500).send({ error: error.message })
// depois
if (error) throw dbError(error)
```

Casos especiais:

- `chat.ts:56` → `req.log.error({ err }, 'Erro ao gerar resposta RAG')`; o 502 mantém
  texto fixo "Erro ao consultar a IA. Tente novamente." (sem `err.message`). A exceção
  de negócio "não indexado" pode continuar 404 com a mensagem própria (é da aplicação,
  não do banco).
- Respostas 404 construídas localmente (`{ error: 'Not found' }`) podem ficar, mas
  padronizar texto em pt-BR ("Não encontrado") já que o restante da API responde em
  português.

### 5. Conferência do front

O front exibe `error` das respostas? `rg "response\\?\\.data\\?\\.error|error\\.response" src/`
no front e validar que as novas mensagens genéricas não degradam UX (toasts). Onde o
front dependia de mensagem específica de 500 (não deveria), ajustar para mensagem local.

## Riscos e rollback

- **Risco baixo:** mudança de texto em respostas de erro. Front trata erros por status
  code nos viewmodels; validar com a suite do front.
- Rollback: revert simples.

## Critérios de aceite

- [ ] `rg "error\.message" src/routes` → zero ocorrências enviadas ao cliente.
- [ ] Todo 500 responde `{ error: 'Erro interno do servidor' }` e loga o detalhe via pino.
- [ ] Zero `console.*` em `src/` (`rg "console\." src/`).
- [ ] Suites back e front verdes.
