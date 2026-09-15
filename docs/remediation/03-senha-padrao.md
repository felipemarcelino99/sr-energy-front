# 03 — Eliminar senha padrão hardcoded

**Severidade:** 🔴 Crítica
**Repos:** sr-energy-api + sr-energy-front
**Esforço:** 4–6h • **Dependências:** 01

## Problema

1. `src/routes/employees.ts:66` — todo funcionário criado via `POST /employees` nasce
   com a senha fixa `'srenergy@123'`, conhecida por qualquer pessoa com acesso ao código
   (e, após o plano 01, pública no histórico do git). Não há troca forçada no primeiro
   login.
2. `supabase/migrations/006_seed_users.sql` — três usuários seed com senha documentada
   `Sr@energy2025`. Se a migration rodar em produção, são três contas comprometidas
   (uma delas `manager`).

## Estratégia

**Caminho A (preferido): convite por email.** `db.auth.admin.inviteUserByEmail(email)`
envia link para o usuário definir a própria senha. Pré-requisito: SMTP configurado no
projeto Supabase (Settings → Auth → SMTP). Sem SMTP custom há rate limit baixo de
emails — verificar antes.

**Caminho B (fallback se SMTP não estiver disponível):** senha aleatória forte gerada
no servidor, retornada **uma única vez** na resposta do POST para o admin repassar ao
funcionário + flag `must_change_password: true` em `app_metadata` (não `user_metadata`,
que é editável pelo próprio usuário), com troca forçada no primeiro login.

O plano detalha o Caminho B (não depende de infra externa); se SMTP existir, trocar o
miolo do passo 2 por `inviteUserByEmail` e pular a geração de senha.

## Passos — Backend

### 1. (TDD) Atualizar `tests/routes/employees.test.ts` primeiro

Casos novos (devem falhar antes da implementação):

```ts
it('POST /employees não usa senha padrão conhecida', async () => {
  // mock de db.auth.admin.createUser captura args
  expect(createUserMock).toHaveBeenCalledWith(
    expect.objectContaining({ password: expect.not.stringContaining('srenergy') })
  )
  const password = createUserMock.mock.calls[0][0].password
  expect(password.length).toBeGreaterThanOrEqual(16)
})

it('POST /employees marca must_change_password em app_metadata', async () => {
  expect(createUserMock).toHaveBeenCalledWith(
    expect.objectContaining({ app_metadata: expect.objectContaining({ must_change_password: true }) })
  )
})

it('POST /employees retorna temporary_password apenas para admin/manager na criação', ...)
```

### 2. Implementar em `employees.ts`

```ts
import { randomBytes } from 'crypto'

function generateTempPassword(): string {
  // 18 bytes -> 24 chars base64url: entropia suficiente, sem chars ambíguos
  return randomBytes(18).toString('base64url')
}

// dentro do POST /employees:
const tempPassword = generateTempPassword()
const { data: authData, error: authError } = await db.auth.admin.createUser({
  email: parsed.data.email,
  password: tempPassword,
  email_confirm: true,
  user_metadata: { name: parsed.data.name }, // role SAI de user_metadata (ver plano 06)
  app_metadata: { must_change_password: true }, // não editável pelo usuário
})
// ...
return reply.status(201).send({ ...data, user_id: userId, temporary_password: tempPassword })
```

Notas:

- `temporary_password` aparece **só** nesta resposta (nunca persistido nem logado).
  Garantir que o logger do Fastify não serializa o body de resposta (default: não).
- Remover `role` de `user_metadata` na criação (alinhado ao plano 06 — a fonte de
  verdade é `user_roles`).

### 3. Endpoint de troca de senha limpa a flag

`PATCH /auth/password` não existe — o front troca senha direto no Supabase
(`ChangePasswordPage`). Duas opções:

- **Opção 1 (simples):** criar `POST /auth/password-changed` na API que, autenticado,
  faz `db.auth.admin.updateUserById(req.user.id, { app_metadata: { must_change_password: false } })`.
  O front chama após `supabase.auth.updateUser({ password })` ter sucesso.
- **Opção 2:** mover a troca de senha inteira para a API. Mais código, mesmo resultado.

Adotar a Opção 1 com teste de rota correspondente.

## Passos — Frontend

### 4. (TDD) Testes primeiro

- `auth.model.test.ts`: `AuthUser` ganha `mustChangePassword: boolean`.
- `ProtectedRoute.test.tsx`: usuário com `mustChangePassword=true` é redirecionado para
  `/change-password` em qualquer rota protegida.
- `ChangePasswordPage`: ao trocar com sucesso, chama `POST /auth/password-changed` e
  redireciona ao dashboard da role.

### 5. Implementar

- `auth.service.ts` (`signIn`/`getSession`): ler
  `user.app_metadata?.must_change_password === true` → `mustChangePassword`.
- `ProtectedRoute.tsx`: redirect forçado.
- `EmployeeFormPage`: exibir a `temporaryPassword` retornada pelo POST uma única vez
  (modal com botão copiar + aviso "não será mostrada novamente").

## Passos — Seeds

### 6. Sanear `006_seed_users.sql` / `008_seed_data.sql`

- Mover ambos para `supabase/seed.sql` (executado apenas por `supabase db reset` local;
  nunca em produção) **antes** de commitá-los (plano 01).
- Trocar a senha fixa por: `crypt(coalesce(current_setting('app.seed_password', true), gen_random_uuid()::text), gen_salt('bf'))`
  — ou simplesmente documentar que o seed é dev-only com senha definida via variável.
- **Produção:** auditar se os 3 usuários seed existem no projeto real
  (`select email from auth.users where email like '%@srenergia.com'`). Se existirem:
  resetar senha/desativar imediatamente.

## Riscos e rollback

- **Risco:** admin perder a senha temporária antes de repassar → mitigado: fluxo de
  "reset password" do Supabase continua disponível.
- **Risco:** usuários antigos criados com `srenergy@123` permanecem vulneráveis →
  ação de dados: setar `must_change_password=true` em `app_metadata` de todos os
  usuários existentes (script one-off via service role) e comunicar.
- Rollback: revert dos commits; flag em `app_metadata` é inerte sem o código.

## Critérios de aceite

- [ ] Nenhuma string de senha no código ou em migrations trackeadas.
- [ ] POST /employees gera senha aleatória ≥16 chars + `must_change_password`.
- [ ] Front força troca de senha no primeiro login.
- [ ] Usuários pré-existentes com senha padrão forçados a trocar.
- [ ] `npm test` verde nos dois repos; e2e de criação de funcionário + primeiro login.
