# 06 — Role do front via user_roles + GET /employees/me

**Severidade:** 🟠 Alta
**Repos:** sr-energy-api + sr-energy-front
**Esforço:** 4–6h • **Dependências:** 02 (policy user_roles), 05 (restrição /employees)

## Problema

1. O front deriva a role de `user_metadata.role`
   (`src/services/auth.service.ts:53,72`). `user_metadata` é **editável pelo próprio
   usuário** (`supabase.auth.updateUser({ data: { role: 'admin' } })`) — qualquer
   employee desbloqueia a UI inteira de admin. O backend já lê de `user_roles`
   (CRIT-02), criando ainda inconsistência potencial front≠back.
2. `resolveEmployeeId` (`auth.service.ts:13-28`) baixa **a lista completa de
   funcionários** (com salários — ver plano 05) só para descobrir o próprio
   `employeeId`. Ineficiente e é o que impede restringir `GET /employees` a
   admin/manager.

## Estratégia

Criar **`GET /employees/me`** no backend retornando identidade + role canônica
(de `user_roles`), e fazer o front usar isso como única fonte de verdade pós-login.
Com isso, `GET /employees` pode ser restrito a admin/manager.

## Passos — Backend

### 1. (TDD) `tests/routes/employees.test.ts`

```ts
describe('GET /employees/me', () => {
  it('retorna id, name, role (de user_roles) e user_id do usuário logado', ...)
  it('retorna employee_id null para admin sem registro em employees', ...)
  it('401 sem token', ...)
})
describe('GET /employees', () => {
  it('403 para role employee', ...)   // novo comportamento
})
```

### 2. Implementar em `employees.ts`

```ts
// GET /employees/me — antes das rotas /:id para não colidir com o param uuid
fastify.get('/me', { onRequest: [guard] }, async (req: any) => {
  const { data: emp } = await db.from('employees')
    .select('id, name, email, phone, role, hired_at')
    .eq('user_id', req.user.id)
    .maybeSingle()
  return {
    user_id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,          // já vem de user_roles via auth plugin
    employee_id: emp?.id ?? null,
    employee: emp ?? null,
  }
})

// GET /employees — restringir:
fastify.get('/', { onRequest: [guard, adminOrManager] }, ...)
```

Nota: `/me` deve ser registrada **antes** de `/:id`; como `/:id` tem
`schema: { params: uuidParams }`, "me" não casaria com uuid — ainda assim, manter a
ordem explícita evita surpresas.

## Passos — Frontend

### 3. (TDD) Atualizar testes

- `auth.service.test` (criar se não existir): `signIn`/`getSession` devem obter role
  via `/employees/me`, **ignorando** `user_metadata.role`.
- Mock `__mocks__/employee.service.ts`: adicionar `getMe`.
- `RoleGuard.test.tsx`: sem mudança de contrato (role continua em `AuthUser`).

### 4. Implementar `auth.service.ts`

```ts
interface MeResponse {
  userId: string
  email: string
  name: string
  role: Role
  employeeId: string | null
}

async function fetchMe(): Promise<MeResponse | null> {
  try {
    const { data } = await api.get('/employees/me')
    return MeResponseSchema.parse(data) // schema Zod novo em employee.model.ts
  } catch {
    return null
  }
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(mapAuthError(error.message))
  const me = await fetchMe()
  if (!me) throw new Error('Não foi possível carregar seu perfil. Tente novamente.')
  return {
    id: data.user.id,
    employeeId: me.employeeId ?? undefined,
    email: me.email,
    name: me.name,
    role: me.role,
  }
}
// getSession(): mesma substituição
```

Remover: `resolveEmployeeId`, `getEmployeeIdFromCache`, `employeeIdCache` e o uso de
`user_metadata.role` / `user_metadata.name`. Procurar usos:
`rg "resolveEmployeeId|getEmployeeIdFromCache|user_metadata" src/`.

### 5. Limpeza de dados

- Parar de gravar `role` em `user_metadata` na criação de funcionário (já previsto no
  plano 03, passo 2).
- Script one-off (service role): remover a chave `role` de `user_metadata` de todos os
  usuários existentes, garantindo que nada mais a consome antes
  (`raw_user_meta_data - 'role'`).

## Sequência de deploy

1. Backend com `/employees/me` (sem ainda restringir `GET /employees`).
2. Front consumindo `/me`.
3. Backend restringindo `GET /employees` a admin/manager (o front de employee já não
   chama a listagem).

## Riscos e rollback

- **Risco:** uma chamada extra no login/restore de sessão (+1 round trip). Aceitável;
  o `/me` substitui a chamada anterior a `/employees` (que era mais pesada).
- **Risco:** usuário sem linha em `user_roles` cai no default `'employee'` do auth
  plugin — comportamento já existente no back; agora o front fica consistente com ele.
- Rollback por etapa de deploy (cada passo é independente e retrocompatível).

## Critérios de aceite

- [ ] `rg "user_metadata" sr-energy-front/src` → zero usos para role/identidade.
- [ ] `supabase.auth.updateUser({ data: { role: 'admin' } })` não altera nada na UI
      (teste manual no console).
- [ ] `GET /employees` retorna 403 para employee; `/employees/me` cobre o fluxo.
- [ ] Suites front e back verdes; e2e login com as três roles.
