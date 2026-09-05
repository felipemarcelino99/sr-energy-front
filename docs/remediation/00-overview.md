# Plano de Remediação — SR Energy (front + back)

Data: 2026-06-12. Origem: review de segurança/arquitetura dos repositórios
`sr-energy-front` e `sr-energy-back/sr-energy-api`.

## Ordem de execução e dependências

| #   | Plano                                                                   | Severidade | Repo          | Depende de | Esforço |
| --- | ----------------------------------------------------------------------- | ---------- | ------------- | ---------- | ------- |
| 01  | [Versionar migrations + higiene de repo](01-versionamento-higiene.md)   | 🔴 Crítico | back (+front) | —          | 1–2h    |
| 02  | [RLS lockdown em todas as tabelas](02-rls-lockdown.md)                  | 🔴 Crítico | back          | 01         | 3–5h    |
| 03  | [Eliminar senha padrão hardcoded](03-senha-padrao.md)                   | 🔴 Crítico | back + front  | 01         | 4–6h    |
| 04  | [Storage privado + signed URLs](04-storage-privado.md)                  | 🔴 Crítico | back + front  | 01         | 4–8h    |
| 05  | [Autorização nas rotas (IDOR)](05-autorizacao-rotas.md)                 | 🟠 Alto    | back          | —          | 6–10h   |
| 06  | [Role do front via user_roles + /employees/me](06-front-role.md)        | 🟠 Alto    | back + front  | 02, 05     | 4–6h    |
| 07  | [Estoque atômico + cancel idempotente](07-estoque-atomico.md)           | 🟠 Alto    | back          | 01         | 6–8h    |
| 08  | [Correção do fluxo OAuth Google](08-oauth-callback.md)                  | 🟠 Alto    | back          | —          | 2–4h    |
| 09  | [Padronização de erros e logging](09-erros-logging.md)                  | 🟠 Alto    | back          | —          | 3–4h    |
| 10  | [Filter injection + paginação + rate limits](10-injection-paginacao.md) | 🟡 Médio   | back + front  | 05         | 6–10h   |
| 11  | [CI, lint backend e dívidas de qualidade](11-ci-qualidade.md)           | 🟡 Médio   | ambos         | —          | 4–8h    |

## Sprints sugeridos

- **Sprint 1 (parar o sangramento):** 01 → 02 → 03. São as três correções que fecham
  acesso indevido a dados e contas. O 01 vem primeiro porque todos os demais criam
  migrations novas que precisam estar versionadas.
- **Sprint 2 (fechar portas laterais):** 04, 05, 08 — exposição de arquivos, IDOR e OAuth.
- **Sprint 3 (consistência):** 06, 07, 09 — coerência front/back de roles, integridade de
  estoque, higiene de erros.
- **Sprint 4 (escala e processo):** 10, 11.

## Regras transversais (valem para todos os planos)

1. **TDD obrigatório** (CLAUDE.md): cada mudança de comportamento começa com teste
   falhando. Backend: `tests/routes/*.test.ts` (Jest). Front: `src/__tests__/` (Jest) e
   `cypress/e2e` para fluxos.
2. **Nenhuma lib nova sem aprovação explícita.** Onde um plano sugerir dependência
   (ex.: ESLint no backend), isso está marcado como **[REQUER APROVAÇÃO]**.
3. **Migrations são imutáveis após aplicadas**: correções via migration nova, nunca
   editando arquivo antigo.
4. **Deploy back antes do front** quando houver mudança de contrato (planos 03, 04, 06,
   10), mantendo compatibilidade por uma release.
5. Cada plano termina com `npm test` verde nos dois repos + smoke Cypress
   (`npm run cy:smoke`) antes de considerar concluído.

## Verificação final (após todos os sprints)

- Rodar os advisors do Supabase (`security` e `performance`) e confirmar zero achados de
  RLS/exposição.
- Teste manual com usuário `employee`: tentar via console do browser
  `supabase.from('clients').select()` → deve falhar.
- Revisão de regressão: fluxos completos de job (criar → checklist → finalizar →
  relatório → evidência → cancelar) com cada role.
