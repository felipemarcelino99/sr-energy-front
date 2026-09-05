# Plano de Implementação — Plataforma de Cursos

**Objetivo:** evoluir o ecossistema SR Energy com uma plataforma de estudos separada (gestão de materiais, aulas, alunos), com página de vendas e checkout, suportando confortavelmente **2.000 alunos**.

**Stack mantida:** React 19 + TypeScript + Vite, Tailwind v4 + DaisyUI, Zustand, React Router v7, Supabase (auth/SDK), Jest + Testing Library, Cypress, TipTap, Axios, Zod.

**Infra alvo:** VPS própria (Hetzner), Cloudflare Stream (vídeo), Cloudflare (CDN/proxy), PostgreSQL, Redis.

---

## 1. Decisões de arquitetura

### 1.1 Hetzner vs Contabo → **Hetzner**

| Critério                      | Hetzner                               | Contabo              |
| ----------------------------- | ------------------------------------- | -------------------- |
| Confiabilidade / rede         | Excelente, SLA consistente            | Irregular, oversold  |
| Snapshots/backups gerenciados | Sim (backup automático +20% do preço) | Limitado             |
| Preço                         | CPX31 (4 vCPU/8GB) ~€13/mês           | Mais barato no papel |

Para uma plataforma paga com alunos, a previsibilidade da Hetzner vale a diferença de poucos euros. Região recomendada: **Ashburn (us-east)** ou **Falkenstein** — latência para o Brasil é mitigada pelo Cloudflare na frente (estáticos servidos da borda; só chamadas de API atravessam).

### 1.2 Separação da plataforma → **Front novo no mesmo repositório (workspace), API com módulos novos**

- **Front da plataforma de estudos:** nova SPA Vite (`apps/study/` via npm workspaces, ou diretório irmão se preferir repo separado), servida em `app.cursos.seudominio.com.br`. Reaproveita a mesma arquitetura MVVM (models/viewmodels/services/views), Zod schemas e componentes compartilháveis extraídos para `packages/ui`.
- **Página de vendas:** página(s) estática(s) geradas no build da SPA de vendas (`cursos.seudominio.com.br`), cacheadas agressivamente no Cloudflare. SEO resolvido com pré-render do HTML da landing no build (sem framework novo — Vite build + HTML estático para a landing; o checkout é SPA).
- **Backend:** os domínios novos (cursos, matrículas, pedidos, webhooks) entram como módulos na API existente (a que o `api.ts` consome) — ou serviço novo se você preferir isolamento. O plano abaixo assume **mesma API, módulos novos**, que é o caminho mais simples (CLAUDE.md: sem complexidade desnecessária).
- **O dashboard atual (sr-energy-front) não é tocado** além da extração de componentes compartilhados.

### 1.3 Supabase + PostgreSQL próprio → **Supabase self-hosted no Hetzner**

Você quer manter a stack (supabase-js no front) **e** ter PostgreSQL em infra própria. O Supabase self-hosted (Docker Compose oficial) entrega os dois: Postgres, GoTrue (auth), PostgREST, Storage e Realtime rodando na sua VPS. O front continua usando `@supabase/supabase-js` apontando para a sua URL.

- **Alternativa válida (decisão sua):** manter Supabase Cloud para auth/DB (plano Pro ~US$25/mês) e usar a VPS só para API + Redis. Menos operação, um pouco mais caro, dados fora da sua infra.
- **Recomendação:** self-hosted. 2.000 alunos é carga pequena para um Postgres bem configurado; o ganho de custo e controle compensa a operação (que o plano de deploy cobre).

### 1.4 Armazenamento de materiais (PDFs, apostilas) → **Cloudflare R2**

Egress zero (importante para downloads de material), S3-compatible, ~US$0,015/GB/mês. O Supabase Storage self-hosted pode usar R2 como backend, mantendo a API de storage que o front já conhece. Downloads protegidos via URLs assinadas com expiração.

### 1.5 Vídeo → **Cloudflare Stream**

- Upload pelo admin via **Direct Creator Upload (tus)** — o vídeo vai do navegador do admin direto para o Cloudflare, sem passar pela VPS.
- Reprodução com **`requireSignedURLs: true`**: a API gera token JWT assinado (validade curta, ex. 4h) só para aluno matriculado. Player oficial via `<iframe>`/elemento `<stream>` — sem lib nova no bundle.
- Custo: US$5/1.000 min armazenados + US$1/1.000 min entregues.

### 1.6 Gateway de pagamento → **decisão pendente (recomendação: Mercado Pago)**

Para o Brasil, PIX é obrigatório no checkout. Opções:

| Gateway                        | PIX | Cartão parcelado | Taxas (aprox.)           | Observação                                                   |
| ------------------------------ | --- | ---------------- | ------------------------ | ------------------------------------------------------------ |
| **Mercado Pago** (recomendado) | Sim | Sim, nativo      | ~0,99% PIX / 4–5% cartão | Checkout Transparente, docs boas, confiança do consumidor BR |
| Stripe                         | Sim | Limitado         | ~3,99% + R$0,39          | Melhor DX, parcelamento fraco no BR                          |
| Pagar.me / Asaas               | Sim | Sim              | variáveis                | Boas alternativas, avaliar taxas no volume esperado          |

A integração é isolada atrás de uma interface (`PaymentGateway` — Strategy pattern), então trocar de gateway depois custa pouco. **Confirme o gateway antes da Fase 4.**

---

## 2. Arquitetura (visão geral)

```
                        ┌──────────────────────────────┐
                        │         Cloudflare           │
   Aluno/Visitante ───► │  CDN + WAF + DNS + Cache     │
                        └──────┬──────────────┬────────┘
                               │              │
                 estáticos (cache borda)      │ /api, /auth
                               │              ▼
              ┌────────────────┴───┐   ┌─────────────────────────────┐
              │ Vendas (landing +  │   │  VPS Hetzner (Docker)       │
              │ checkout SPA)      │   │  ┌───────────────────────┐  │
              │ App do aluno (SPA) │   │  │ Caddy (TLS, proxy)    │  │
              │ Admin (SPA)        │   │  ├───────────────────────┤  │
              └────────────────────┘   │  │ API (módulos cursos,  │  │
                                       │  │ checkout, webhooks)   │  │
   Cloudflare Stream ◄── tokens ────── │  ├───────────────────────┤  │
   (vídeo das aulas)     assinados     │  │ Supabase self-hosted  │  │
                                       │  │ (Postgres, GoTrue,    │  │
   Cloudflare R2 ◄── URLs assinadas ── │  │  PostgREST, Storage)  │  │
   (PDFs, materiais)                   │  ├───────────────────────┤  │
                                       │  │ Redis (cache, rate    │  │
   Gateway de pagamento ── webhook ──► │  │ limit, filas leves)   │  │
   (Mercado Pago)                      │  └───────────────────────┘  │
                                       └─────────────────────────────┘
```

**Fluxos críticos:**

1. **Compra:** landing → checkout → gateway (PIX/cartão) → webhook `payment.approved` → API valida assinatura → cria `enrollment` → e-mail com acesso. Idempotente (tabela `webhook_events` com unique no event id).
2. **Assistir aula:** aluno autenticado → API verifica matrícula → emite JWT do Stream → player carrega vídeo direto do Cloudflare. A VPS nunca serve bytes de vídeo.
3. **Upload de aula (admin):** admin pede URL tus à API → upload navegador→Cloudflare → webhook `video.ready` atualiza `lessons.video_status`.

---

## 3. Modelo de dados (PostgreSQL)

Schema separado `study` no mesmo Postgres (isolamento lógico do domínio atual sem custo operacional de outro banco).

```sql
-- Identidade: reusa auth.users (GoTrue). Papel via tabela própria.
study.profiles        (user_id PK → auth.users, full_name, cpf, phone, role: 'student'|'admin')

-- Catálogo
study.courses         (id, slug UNIQUE, title, subtitle, description, cover_url,
                       price_cents, status: 'draft'|'published'|'archived', created_at)
study.modules         (id, course_id FK, title, position)
study.lessons         (id, module_id FK, title, description_rich (TipTap JSON),
                       video_uid, video_status: 'none'|'uploading'|'processing'|'ready',
                       duration_seconds, position, is_free_preview bool)
study.materials       (id, lesson_id FK NULL, course_id FK, title, r2_key, size_bytes, mime)

-- Acesso e progresso
study.enrollments     (id, user_id FK, course_id FK, source: 'purchase'|'manual',
                       status: 'active'|'suspended'|'refunded', expires_at NULL,
                       UNIQUE(user_id, course_id))
study.lesson_progress (user_id, lesson_id, completed_at, last_position_seconds,
                       PK(user_id, lesson_id))

-- Vendas
study.orders          (id, user_id NULL (guest checkout), email, course_id,
                       amount_cents, status: 'pending'|'paid'|'failed'|'refunded'|'expired',
                       gateway, gateway_ref, coupon_id NULL, created_at)
study.coupons         (id, code UNIQUE, percent_off, max_uses, used_count, expires_at)
study.webhook_events  (id, gateway, event_id UNIQUE, payload jsonb, processed_at)
```

**RLS (Row Level Security)** em todas as tabelas `study.*`:

- Aluno lê apenas cursos `published`, suas matrículas e seu progresso; escreve apenas `lesson_progress` próprio.
- `orders`/`webhook_events`/mutações de catálogo: somente `service_role` (API) e admins.
- Aulas/materiais visíveis somente com matrícula ativa (ou `is_free_preview`).

Índices além das PKs: `enrollments(user_id)`, `lessons(module_id, position)`, `orders(status, created_at)`, `lesson_progress(user_id)`.

---

## 4. Endpoints novos da API

```
# Público (vendas)
GET  /api/study/catalog                 # cursos publicados (cache Redis 5 min)
GET  /api/study/courses/:slug           # detalhe p/ página de vendas
POST /api/study/checkout                # cria order + intent no gateway, retorna PIX QR / form cartão
POST /api/study/webhooks/payment        # webhook gateway (assinatura verificada, idempotente)
POST /api/study/webhooks/stream         # webhook Cloudflare Stream (video.ready)

# Aluno (JWT Supabase)
GET  /api/study/me/courses              # matrículas + progresso agregado
GET  /api/study/me/courses/:id          # módulos/aulas + progresso por aula
POST /api/study/lessons/:id/token       # token assinado do Stream (verifica matrícula)
PUT  /api/study/lessons/:id/progress    # posição + conclusão
GET  /api/study/materials/:id/url       # URL assinada R2 (verifica matrícula)

# Admin (role admin)
CRUD /api/study/admin/courses|modules|lessons|materials|coupons
POST /api/study/admin/lessons/:id/upload-url     # tus direct upload
GET  /api/study/admin/students                   # lista alunos + progresso
POST /api/study/admin/enrollments                # matrícula manual / suspensão
GET  /api/study/admin/metrics                    # vendas, conclusão, engajamento
```

**Redis:** cache do catálogo e agregados de progresso (TTL curto), rate limiting (checkout: 5 req/min/IP; token de vídeo: 30/min/usuário), lock de idempotência de webhooks.

---

## 5. Frontend — três superfícies

### 5.1 Vendas (`cursos.dominio.com.br`)

- Landing por curso: hero, currículo (módulos/aulas expandíveis), prova social, FAQ, CTA. Design definido antes via skill `interface-design` / `design` (identidade S&R).
- Checkout: dados do comprador (Zod: CPF, e-mail), escolha PIX (QR + copia-e-cola + polling de status) ou cartão (parcelamento). Pós-pagamento: criação de senha → redireciona para o app.
- HTML da landing pré-renderizado no build para SEO; Cloudflare cacheia.

### 5.2 App do aluno (`app.cursos.dominio.com.br`)

- Login (Supabase Auth — mesma infra GoTrue), "Meus cursos" com progresso, página do curso (sidebar de módulos/aulas, checkmarks), player (iframe Stream + retomar posição + marcar concluída + navegação próxima/anterior), aba de materiais com download assinado.
- Mobile-first (alunos consomem muito por celular).

### 5.3 Admin de cursos (dentro do app, rota `/admin`, RoleGuard)

- Reusa padrões existentes do dashboard (`RoleGuard`, `Pagination`, `ToastContainer`, TipTap `RichTextEditor` para descrição de aulas).
- CRUD de cursos/módulos/aulas com ordenação por posição; upload de vídeo tus com barra de progresso e status (`processing` → `ready` via webhook); upload de materiais; gestão de alunos (busca, matrícula manual, suspensão, progresso individual); cupons; métricas (Recharts: vendas/dia, taxa de conclusão, aulas mais assistidas).

**Estado (Zustand):** stores separadas — `useStudyAuthStore`, `useCatalogStore`, `usePlayerStore`, `useCheckoutStore`. Services seguem o padrão atual (`*.service.ts` + viewmodels testáveis).

---

## 6. Infra e deploy

### 6.1 Topologia inicial (até ~2.000 alunos): **1 VPS**

**Hetzner CPX31** (4 vCPU, 8 GB RAM, 160 GB NVMe, ~€13/mês) roda tudo via Docker Compose:

```
caddy            # TLS automático + reverse proxy
api              # API (módulos study)
supabase-*       # kong, gotrue, postgrest, storage, realtime, studio
postgres         # 2GB shared_buffers, max_connections 100 + pgbouncer (incluso no stack supabase)
redis            # maxmemory 512mb, allkeys-lru
```

Justificativa de capacidade: vídeo e estáticos não tocam a VPS (Stream + CDN). Sobram chamadas de API leves (progresso, tokens, catálogo cacheado). 2.000 alunos ≈ 100–300 usuários simultâneos em pico de lançamento ≈ < 50 req/s na API — folgado para 4 vCPU. **Plano B de pico:** resize do CPX31→CPX41 leva minutos na Hetzner.

Quando crescer (>5–10k alunos): separar Postgres em segunda VPS via rede privada Hetzner — a arquitetura já permite.

### 6.2 Cloudflare

- DNS + proxy laranja em tudo; **Full (strict)** TLS.
- Cache rules: estáticos imutáveis (`/assets/*` 1 ano), landing HTML com `s-maxage` curto.
- WAF managed rules + rate limiting de borda no `/api/study/checkout`.
- R2 para materiais; Stream para vídeo.

### 6.3 CI/CD (GitHub Actions)

1. PR: `npm run lint` + `npm test` (Jest) + `npm run build`.
2. Merge na master: Cypress (`cy:run`) contra preview local + build das SPAs.
3. Deploy: build de imagens Docker → push no GHCR → SSH na VPS → `docker compose pull && up -d` (API) e upload dos estáticos. Migrations versionadas (SQL em `supabase/migrations/`) aplicadas no deploy, sempre backward-compatible.

### 6.4 Backups e DR

- `pg_dump` diário + cópia para R2 (criptografado), retenção 30 dias; **teste de restore mensal**.
- Snapshot Hetzner semanal + backup automático Hetzner habilitado (+20%).
- Vídeos já são redundantes no Cloudflare; R2 tem durabilidade própria.

### 6.5 Observabilidade

- **Uptime Kuma** (na VPS ou externo) com alertas para `/healthz` da API e login.
- **Netdata** ou node-exporter+Grafana Cloud free para CPU/RAM/disco/Postgres.
- Logs estruturados da API (JSON) com retenção local via Docker logging driver; Sentry (free tier) para erros de front e API — _requer aprovação se adicionar SDK ao front_.

### 6.6 Segurança / LGPD

- Cartão nunca toca seu servidor (tokenização no gateway) → sem escopo PCI relevante.
- Dados pessoais mínimos (nome, e-mail, CPF p/ nota fiscal); política de privacidade na landing; consentimento no checkout.
- Secrets só via env na VPS (nunca commitados); `service_role` key jamais no front.
- Backups criptografados; acesso SSH só por chave; fail2ban; portas fechadas exceto 80/443 (e Postgres apenas na rede Docker interna).

---

## 7. Fases de implementação (TDD em todas — testes antes, sempre)

### Fase 0 — Fundação de infra (3–5 dias)

VPS Hetzner + Docker + Caddy + Supabase self-hosted + Redis; Cloudflare DNS/proxy/R2; contas Stream e gateway (sandbox); CI/CD pipeline e deploy "hello world"; backups configurados e testados.
**Critério de pronto:** deploy automatizado funcionando, restore de backup validado.

### Fase 1 — Domínio e dados (3–5 dias)

Migrations do schema `study` + RLS; models + Zod schemas no front (TDD: testes de model primeiro, como `auth.model.test.ts`); seeds de desenvolvimento; endpoints de catálogo (somente leitura) com testes de API.
**Pronto:** RLS validada por testes (aluno não lê o que não pode), catálogo servido com cache.

### Fase 2 — Área do aluno (1,5–2 semanas)

Design via skill antes de cada tela. Login/recuperação de senha; "Meus cursos"; página do curso; player com token assinado, progresso e retomar posição; materiais com URL assinada. Jest em viewmodels/components, Cypress no fluxo login→assistir→concluir aula.
**Pronto:** aluno seed assiste vídeo real do Stream com URL assinada e progresso persiste.

### Fase 3 — Admin (1,5–2 semanas)

CRUD de cursos/módulos/aulas; upload tus com status; materiais; gestão de alunos e matrícula manual; cupons; métricas básicas.
**Pronto:** curso completo criado pelo admin, consumível por aluno matriculado manualmente.

### Fase 4 — Vendas e checkout (1,5–2 semanas)

**Pré-requisito: gateway confirmado.** Landing pré-renderizada; checkout PIX + cartão; webhook idempotente → matrícula + e-mail transacional (Resend/Postmark — _aprovação de dependência/serviço_); fluxo de reembolso (suspende matrícula); cupons no checkout. Cypress: compra sandbox PIX e cartão de ponta a ponta.
**Pronto:** compra sandbox vira matrícula ativa sem intervenção manual; webhook duplicado não duplica matrícula.

### Fase 5 — Hardening e go-live (1 semana)

Teste de carga (k6 ou autocannon na API — picos de lançamento); rate limits ajustados; Uptime Kuma + alertas; revisão de segurança (skill `security-review`); migração/criação dos alunos iniciais; lançamento beta com turma pequena → ajustes → abertura.

**Total estimado: 7–9 semanas** (1 dev em tempo parcial estende proporcionalmente).

---

## 8. Custos mensais estimados (2.000 alunos)

| Item                                                                       | Custo                                                                   |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Hetzner CPX31 + backup automático                                          | ~€16 (~R$ 100)                                                          |
| Cloudflare (CDN/DNS/WAF)                                                   | Free tier                                                               |
| Cloudflare Stream — ex.: 3.000 min armazenados + 50.000 min assistidos/mês | ~US$ 65 (~R$ 360)                                                       |
| Cloudflare R2 — 50 GB materiais                                            | ~US$ 0,75                                                               |
| E-mail transacional (Resend free → pago)                                   | US$ 0–20                                                                |
| Domínio                                                                    | ~R$ 40/ano                                                              |
| **Total**                                                                  | **~R$ 480–600/mês** (dominado pelo Stream, que escala com consumo real) |

Taxas do gateway são por transação (não custo fixo).

---

## 9. Decisões pendentes (confirmar antes das fases marcadas)

1. **Gateway de pagamento** (Fase 4) — recomendação: Mercado Pago.
2. **Supabase self-hosted vs Cloud** (Fase 0) — recomendação: self-hosted, conforme seção 1.3.
3. **Monorepo (npm workspaces) vs repositório novo** para o front da plataforma (Fase 1) — recomendação: workspaces no repo atual, extraindo `packages/ui`.
4. **Novas dependências prováveis** (exigem aprovação explícita, CLAUDE.md): cliente tus (`tus-js-client`) para upload de vídeo no admin; SDK do gateway escolhido (apenas na API); Sentry (opcional).
