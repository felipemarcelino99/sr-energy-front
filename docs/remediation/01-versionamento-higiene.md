# 01 — Versionar migrations + higiene de repositório

**Severidade:** 🔴 Crítica (migrations) / 🔵 Baixa (demais itens)
**Repos:** sr-energy-api (principal), sr-energy-front
**Esforço:** 1–2h • **Dependências:** nenhuma • **Bloqueia:** 02, 03, 04, 07

## Problema

1. O `.gitignore` do backend contém o padrão `*supabase`, que ignora o diretório
   `supabase/`. Resultado: **migrations 004–010 e 012–014 não estão no git** (001–003 e
   011 foram adicionadas antes da regra e permaneceram trackeadas). Justamente as
   migrations de RLS (`010`), `user_roles` (`009`) e seeds estão invisíveis ao
   versionamento — o schema do banco não é reconstruível nem auditável.
2. `sr-energy-front/.env.production` está trackeado no git (contém apenas placeholders,
   mas normaliza o anti-padrão de commitar `.env*`).
3. O hook do Claude Code `.claude/hooks/conventional-commits.py` referenciado no
   settings não existe no caminho resolvido (problema de encoding com "ç/ã" no path),
   quebrando a ferramenta Bash em toda sessão.
4. Backend tem **dois** configs de deploy (`railway.toml` e `render.yaml`) sem
   documentação de qual é o ativo.

## Passos

### 1. Corrigir `.gitignore` do backend

Em `sr-energy-api/.gitignore`, substituir:

```diff
-# Supabase
-*supabase
+# Supabase (artefatos locais — migrations SÃO versionadas)
+supabase/.temp/
+supabase/.branches/
```

### 2. Adicionar migrations ao git

```bash
cd sr-energy-api
git add supabase/migrations/
git status   # conferir: 004,005,006,007,008,009,010,012,013,014 staged
```

⚠️ **Antes de commitar, revisar o conteúdo de cada migration adicionada** procurando
segredos. Já identificado: `006_seed_users.sql` contém senha em texto claro
(`Sr@energy2025`). Tratar conforme plano 03 **antes** do commit — no mínimo, mover
`006_seed_users.sql` e `008_seed_data.sql` para `supabase/seed.sql` (convenção do
Supabase CLI para dados de dev local, nunca aplicado em prod) e trocar a senha por
placeholder gerado.

Commit sugerido: `chore: versionar migrations do Supabase (004-014)`.

### 3. Frontend — `.env.production`

```bash
cd sr-energy-front
git mv .env.production .env.production.example
```

Atualizar referências no README (se houver) e conferir que `.gitignore` já cobre
`.env.production` (cobre).

### 4. Hook quebrado do Claude Code

Verificar `.claude/settings.json` (ou `settings.local.json`) do front: o hook PreToolUse
aponta para `$CLAUDE_PROJECT_DIR/.claude/hooks/conventional-commits.py`, que não existe.
Opções (escolher uma):

- Restaurar o script no caminho esperado; ou
- Remover a entrada do hook do settings.

### 5. Deploy config único

Decidir entre Railway e Render; remover o arquivo do outro ou adicionar nota no
`backend-plan.md` explicando por que os dois existem.

## Testes / verificação

- `git ls-files supabase/migrations/ | wc -l` → **14** (ou 12 + seed.sql, se seeds
  movidos).
- Clone limpo do repo: `supabase db reset` (ou aplicação manual das migrations em um
  projeto vazio) reconstrói o schema sem erro.
- Ferramenta Bash do Claude Code volta a funcionar sem erro de hook.

## Riscos e rollback

- **Risco baixo.** Nenhuma mudança de runtime. O único cuidado é o item de segredos nos
  seeds (ver plano 03).
- Rollback: `git revert` do commit.

## Critérios de aceite

- [ ] Todas as migrations versionadas; padrão `*supabase` removido do `.gitignore`.
- [ ] Nenhuma senha/segredo real em arquivo trackeado.
- [ ] `.env.production` renomeado para `.example`.
- [ ] Hook do Bash funcionando ou removido.
- [ ] Um único config de deploy (ou justificativa documentada).
