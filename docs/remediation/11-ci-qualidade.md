# 11 — CI, lint no backend e dívidas de qualidade

**Severidade:** 🟡 Média (processo) / 🔵 Baixa (higiene)
**Repos:** ambos
**Esforço:** 4–8h • **Dependências:** nenhuma (quanto antes, mais valor)

## Problemas

1. **Nenhum dos dois repos tem CI** — 105 arquivos de teste no front e 13 no back só
   rodam quando alguém lembra.
2. **Backend sem ESLint/Prettier** (front tem).
3. **Backend: `tests/` excluído do tsconfig** — testes fora do typecheck.
4. **Cobertura assimétrica no back:** sem testes para as rotas `clients`,
   `schedule-events`, `google-auth` (criado no plano 08), `bags`.
5. **Type safety descartada nas rotas:** `(fastify as any).authenticate`, `req: any`,
   `query as any` em todos os arquivos de rota.
6. **Higiene de dependências (front):** `@types/react-big-calendar` em `dependencies`;
   `@types/dompurify` deprecado (dompurify ≥3.2 traz tipos próprios); `tslib`
   provavelmente sem uso; config `msw` no package.json sem msw instalado.
7. Duplicação de CRUD nas rotas do back (clients/machines/tools/bags ~idênticos).

## Passos

### 1. CI — GitHub Actions (ambos os repos)

`/.github/workflows/ci.yml` no **front**:

```yaml
name: CI
on: { push: { branches: [master] }, pull_request: {} }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc -b --noEmit
      - run: npm test -- --ci
      - run: npm run build
```

No **back** (igual, sem build de Vite):

```yaml
- run: npm ci
- run: npm run lint # após passo 2
- run: npx tsc --noEmit -p tsconfig.ci.json # inclui tests/
- run: npm test -- --ci
- run: npm run build
```

Cypress: job separado e opcional num primeiro momento (exige backend + Supabase de
teste). Começar com `cy:smoke` contra preview local com API mockada, ou marcar como
workflow manual (`workflow_dispatch`) — decidir conforme infra disponível.

### 2. ESLint + Prettier no backend **[REQUER APROVAÇÃO — novas devDependencies]**

Espelhar o setup do front (flat config, `typescript-eslint`, `eslint-config-prettier`).
Regra que pega a maior dívida: `@typescript-eslint/no-explicit-any: warn` (subir para
`error` após o passo 4).

### 3. Typecheck dos testes do backend

`tsconfig.ci.json`:

```json
{ "extends": "./tsconfig.json", "compilerOptions": { "noEmit": true }, "include": ["src", "tests"] }
```

(Build de produção continua com o tsconfig atual, que exclui `tests/`.)

### 4. Eliminar `as any` nas rotas

A module augmentation em `plugins/auth.ts` já tipa `FastifyInstance.authenticate` e
`FastifyRequest.user`. Logo:

- `const guard = (fastify as any).authenticate` → `const guard = fastify.authenticate`
  (se o TS reclamar de ordem de registro de plugin, tipar via `fastify.authenticate`
  funciona porque a augmentation é global).
- `async (req: any, reply)` → tipar `Querystring`/`Params`/`Body` via generics do
  Fastify, como `clients.ts` já faz parcialmente.
- `(query as any).eq(...)` → encadear os filtros antes do `await` ou tipar com os
  generics do supabase-js v2.

Fazer por arquivo de rota, rodando a suite a cada arquivo (refactor sob testes verdes).

### 5. Testes de rota faltantes (TDD invertido — caracterização)

Criar `tests/routes/clients.test.ts`, `schedule-events.test.ts`, `bags.test.ts`
caracterizando o comportamento atual (felizes + 401/403 + validação), **antes** dos
planos 05/10 alterarem essas rotas — vira a rede de segurança deles. Meta: toda rota
com ao menos teste de auth, validação e caminho feliz.

### 6. Higiene de dependências (front)

```bash
npm uninstall @types/dompurify              # dompurify traz tipos próprios
npm install -D @types/react-big-calendar    # mover de deps p/ devDeps (uninstall + install -D)
rg "tslib" src/ vite.config.ts              # se zero uso direto: npm uninstall tslib
# remover o bloco "msw" do package.json (msw não está instalado)
```

(São remoções/reclassificações, não libs novas — sem conflito com a regra de
aprovação; ainda assim, listado aqui para visibilidade.)

### 7. Reduzir duplicação de CRUD no backend (opcional, último)

`clients`, `machines`, `tools`, `bags` repetem o mesmo CRUD. Extrair
`buildCrudRoutes({ table, selectColumns, bodySchema, roles })` em
`src/utils/crud-routes.ts` e migrar **uma** rota por vez sob os testes do passo 5.
Critério do CLAUDE.md satisfeito: já há 4+ usos reais (não é abstração prematura).
Não generalizar rotas com lógica própria (jobs, reports, chat).

### 8. Mover `usePagination` para `src/hooks/`

Front: `src/utils/usePagination.ts` é um hook React → `src/hooks/usePagination.ts`
(ou remover, se o plano 10 migrar tudo para paginação server-side). Atualizar imports
e testes.

## Riscos e rollback

- Risco baixo; tudo é tooling/refactor sob testes. O maior cuidado é o passo 4
  (tipagem) não alterar comportamento — garantido pela suite + caracterização do
  passo 5 feita antes.

## Critérios de aceite

- [ ] CI verde nos dois repos em PR e push para master.
- [ ] Backend com lint configurado e `rg "as any" src/` ≈ 0.
- [ ] `tsc --noEmit` cobrindo `tests/` no back.
- [ ] Toda rota do back com arquivo de teste.
- [ ] package.json do front sem deps mortas/mal classificadas.
