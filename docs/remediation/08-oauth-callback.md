# 08 — Correção do fluxo OAuth Google (callback)

**Severidade:** 🟠 Alta (funcional + segurança)
**Repo:** sr-energy-api
**Esforço:** 2–4h • **Dependências:** nenhuma

## Problema

`src/routes/google-auth.ts` registra `GET /auth/google/callback` com
`onRequest: [guard]` — ou seja, exige header `Authorization: Bearer`. Mas o callback é
uma **navegação de browser redirecionada pelo Google**, que nunca envia esse header.
Consequências:

- Ou o fluxo está quebrado em produção (callback sempre 401), ou o front faz um fetch
  manual da URL de callback (frágil e fora do padrão OAuth).
- O mesmo vale para `GET /auth/google` (também com guard + `reply.redirect`) — um
  redirect de browser para esse endpoint também não carrega Bearer.

O `state` HMAC já existe e **já carrega o userId assinado** — é a peça certa para
autenticar o callback sem sessão.

## Estratégia

1. `GET /auth/google` deixa de redirecionar: vira endpoint JSON autenticado que
   **retorna a URL** de autorização (`{ url }`); o front faz
   `window.location.href = url`. (Chamada via axios já envia o Bearer — funciona.)
2. `GET /auth/google/callback` **remove o guard** e autentica exclusivamente pelo
   `state` HMAC, que passa a embutir também um timestamp com validade curta
   (anti-replay).

## Passos

### 1. (TDD) Criar `tests/routes/google-auth.test.ts` (hoje não existe)

```ts
it('GET /auth/google retorna { url } para usuário autenticado', ...)
it('GET /auth/google retorna 401 sem token', ...)
it('GET /callback SEM Bearer mas com state válido conclui o fluxo', ...)
it('GET /callback com state adulterado redireciona para ?google=error sem tocar no banco', ...)
it('GET /callback com state expirado (>10min) redireciona para ?google=error', ...)
it('GET /callback sem refresh_token redireciona para ?google=no_refresh_token', ...)
```

E `tests/utils/oauth-state.test.ts`:

```ts
it('verifyState rejeita state com timestamp expirado', ...)
it('parseState extrai userId de state válido', ...)
```

### 2. Atualizar `src/utils/oauth-state.ts`

```ts
const STATE_TTL_MS = 10 * 60 * 1000

export function generateState(userId: string): string {
  const nonce = randomBytes(16).toString('hex')
  const payload = `${userId}:${Date.now()}:${nonce}`
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

/** Valida assinatura + TTL e retorna o userId embutido (ou null). */
export function parseState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString()
    const lastColon = decoded.lastIndexOf(':')
    const payload = decoded.slice(0, lastColon)
    const sig = decoded.slice(lastColon + 1)
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')
    if (sig.length !== expected.length) return null
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null
    const [userId, ts] = payload.split(':')
    if (Date.now() - Number(ts) > STATE_TTL_MS) return null
    return userId || null
  } catch {
    return null
  }
}
```

(`verifyState(state, expectedUserId)` pode virar `parseState(state) === expectedUserId`
ou ser removido — atualizar chamadores.)

### 3. Atualizar `src/routes/google-auth.ts`

```ts
// GET /auth/google — autenticado via Bearer (chamada axios do front)
fastify.get('/', { onRequest: [guard] }, async (req: any) => {
  const state = generateState(req.user.id)
  return { url: getAuthUrl(state) }
})

// GET /auth/google/callback — SEM guard; autenticação = state HMAC
fastify.get('/callback', async (req, reply) => {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string }
  const fail = () => reply.redirect(`${process.env.FRONTEND_URL}/calendar?google=error`)

  if (error || !code || !state) return fail()
  const userId = parseState(state)
  if (!userId) {
    fastify.log.warn('OAuth state verification failed')
    return fail()
  }

  const tokens = await exchangeCode(code)
  if (!tokens.refresh_token)
    return reply.redirect(`${process.env.FRONTEND_URL}/calendar?google=no_refresh_token`)

  const { error: dbError } = await db
    .from('employees')
    .update({ google_refresh_token: encrypt(tokens.refresh_token) })
    .eq('user_id', userId)
  if (dbError) {
    fastify.log.error(dbError, 'Failed to save google refresh token')
    return fail()
  }

  return reply.redirect(`${process.env.FRONTEND_URL}/calendar?google=connected`)
})
```

### 4. Frontend

Localizar o ponto que inicia a conexão Google (`rg "auth/google" src/`):
trocar link/navegação direta por chamada axios `GET /auth/google` seguida de
`window.location.assign(data.url)`. Teste de viewmodel/componente primeiro.

### 5. Configuração

Conferir no Google Cloud Console que o redirect URI registrado aponta para a **API**
(`https://api.../auth/google/callback`) e que `GOOGLE_REDIRECT_URI` casa exatamente.

## Riscos e rollback

- **Risco:** state é o único fator no callback — mitigado por HMAC + nonce + TTL de
  10min + o fato de o `code` do Google ser de uso único. É o padrão da indústria para
  esse fluxo.
- **Risco:** usuários com fluxo "quebrado mas funcionando" via fetch manual — verificar
  o front antes (passo 4) para não deixar chamador órfão.
- Rollback: revert; o formato antigo de state fica inválido por ~10min (inofensivo).

## Critérios de aceite

- [ ] Conexão Google Calendar funciona ponta a ponta em staging (browser real).
- [ ] Callback sem Bearer e com state válido → sucesso; state adulterado/expirado → erro.
- [ ] Testes novos de rota e de utils verdes.
