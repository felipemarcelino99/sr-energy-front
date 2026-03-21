# Frontend — Plano de Implementação

> Stack: React, TypeScript, Tailwind, DaisyUI, Zustand, TipTap, Cypress, Jest, Zod, Axios.
> Consulte `backend.md` para decisões de banco, RAG, notificações e PDF.

---

## Padrões do Projeto

### MVVM

Cada funcionalidade segue a separação:

| Camada | Responsabilidade | Onde vive |
|---|---|---|
| **Model** | Tipos, interfaces e schemas Zod | `src/models/` |
| **ViewModel** | Estado e lógica de negócio (Zustand + hooks) | `src/viewmodels/` |
| **View** | Renderização pura, sem lógica de negócio | `src/views/` |
| **Service** | Chamadas HTTP (Axios) | `src/services/` |

> Views não acessam services diretamente — sempre passam pelo ViewModel.

### TDD

Cada unidade segue o ciclo:

```
🔴 RED    → Escrever o teste (falha esperada)
🟢 GREEN  → Escrever o mínimo de código para passar
🔵 REFACTOR → Melhorar sem quebrar os testes
```

> A ordem dos checklists em cada sessão respeita esse ciclo: Model → Teste → ViewModel → View → Refactor.

---

## Estrutura de Pastas

```
src/
├── assets/
├── models/                  # Tipos, interfaces, schemas Zod
│   ├── auth.model.ts
│   ├── employee.model.ts
│   └── ...
├── viewmodels/              # Zustand stores + hooks de lógica
│   ├── auth.viewmodel.ts
│   ├── employee.viewmodel.ts
│   └── ...
├── views/
│   ├── components/          # Componentes reutilizáveis (UI puro)
│   ├── layouts/             # Layouts por role
│   └── pages/               # Páginas/rotas
├── services/                # Chamadas Axios
├── utils/                   # Helpers e formatters
└── __tests__/               # Testes unitários (espelha src/)
    ├── models/
    ├── viewmodels/
    └── views/
```

---

## Sessão 1 — Setup do Projeto

- [ ] Criar projeto com Vite + React + TypeScript (`npm create vite@latest`)
- [ ] Configurar Tailwind CSS + DaisyUI
- [ ] Instalar Zustand, TipTap, Zod, Axios
- [ ] Configurar paths absolutos (`@/`) no `tsconfig.json` e `vite.config.ts`
- [ ] Configurar ESLint + Prettier
- [ ] Configurar Jest + Testing Library + `jest.config.ts`
- [ ] Configurar Cypress
- [ ] Criar estrutura de pastas conforme MVVM acima
- [ ] Criar arquivo `.env.example` com as variáveis necessárias
- [ ] **[TDD]** Escrever teste de smoke: renderiza `<App />` sem erros
- [ ] Confirmar que o teste passa
- [ ] Commit inicial

---

## Sessão 2 — Autenticação & Roles

**Model**
- [x] Criar `auth.model.ts`: tipos `Role`, `AuthUser`, schema Zod do formulário de login

**🔴 RED — Testes**
- [x] `auth.model.test.ts`: schema Zod valida/rejeita corretamente os inputs
- [x] `auth.viewmodel.test.ts`: `login()` chama o service, popula o store e redireciona
- [x] `auth.viewmodel.test.ts`: `logout()` limpa o store
- [x] `ProtectedRoute.test.tsx`: redireciona para `/login` se não autenticado
- [x] `RoleGuard.test.tsx`: redireciona se role não autorizada

**🟢 GREEN — Implementação**
- [x] Configurar cliente Supabase (`src/services/supabase.ts`)
- [x] Criar `auth.service.ts`: funções `signIn`, `signOut`, `getSession`
- [x] Criar `auth.viewmodel.ts` (Zustand): estado `user`, `role`, `loading`; ações `login`, `logout`
- [x] Criar `AuthContext` + hook `useAuth()` consumindo o viewmodel
- [x] Criar `ProtectedRoute` e `RoleGuard`
- [x] View `LoginPage`: formulário e-mail/senha, feedback de erro, loading no botão
- [x] Refresh automático de sessão

**🔵 REFACTOR**
- [x] Garantir que nenhuma lógica de autenticação está na View
- [x] Confirmar 100% dos testes passando

---

## Sessão 3 — Layout & Navegação

**Model**
- [x] Criar `navigation.model.ts`: tipo `NavItem` com `label`, `path`, `icon`, `allowedRoles`

**🔴 RED — Testes**
- [x] `navigation.model.test.ts`: filtragem de itens por role retorna somente os permitidos
- [x] `Sidebar.test.tsx`: renderiza itens corretos para cada role
- [x] `Navbar.test.tsx`: exibe nome, role badge e ícone de notificações

**🟢 GREEN — Implementação**
- [x] Criar `AppLayout` unificado (sidebar + navbar, role-aware)
- [x] Sidebar responsiva com DaisyUI
- [x] Navbar: nome do usuário, role badge, sino de notificações, logout
- [x] Itens de menu por role:
  - Manager/Admin: Dashboard, Trabalhos, Máquinas, Contratos, Funcionários, Financeiro
  - Employee: Dashboard, Meus Trabalhos, Chat IA
- [x] Página 404
- [x] Configurar todas as rotas no `App.tsx` com React Router v6

**🔵 REFACTOR**
- [x] View não deve tomar decisão de quais itens mostrar — delegar ao model
- [x] Confirmar 100% dos testes passando

---

## Sessão 4 — Dashboard Manager/Admin

**Model**
- [x] Criar `dashboard.model.ts`: tipos `FinancialSummary`, `JobStatusSummary`, `ExpiringContract`

**🔴 RED — Testes**
- [x] `dashboard.viewmodel.test.ts`: calcula saldo corretamente a partir de transações
- [x] `dashboard.viewmodel.test.ts`: agrupa trabalhos por status corretamente
- [x] `dashboard.viewmodel.test.ts`: filtra contratos expirando nos próximos 30 dias
- [x] `FinancialCard.test.tsx`: exibe valores formatados corretamente
- [x] `JobStatusCard.test.tsx`: exibe contagem por status

**🟢 GREEN — Implementação**
- [x] Criar `dashboard.service.ts`: busca resumo financeiro, trabalhos e contratos
- [x] Criar `dashboard.viewmodel.ts` (Zustand): estado e seletores computados
- [x] View `ManagerDashboardPage`:
  - [x] Card: resumo financeiro do mês (entradas, saídas, saldo)
  - [x] Card: trabalhos por status
  - [x] Lista de trabalhos recentes
  - [x] Widget: contratos próximos ao vencimento

**🔵 REFACTOR**
- [x] Filtros e cálculos vivem no ViewModel, não na View
- [x] Confirmar 100% dos testes passando

---

## Sessão 5 — Dashboard Employee

**Model**
- [x] Reutilizar `dashboard.model.ts` — adicionar tipo `EmployeeDashboardData`

**🔴 RED — Testes**
- [x] `dashboard.viewmodel.test.ts`: filtra trabalhos pelo `employeeId` do usuário logado
- [x] `NextJobWidget.test.tsx`: exibe o trabalho mais próximo ou estado vazio

**🟢 GREEN — Implementação**
- [x] Criar `employee.dashboard.viewmodel.ts` ou extender o store existente
- [x] View `EmployeeDashboardPage`:
  - [x] Card: meus trabalhos por status
  - [x] Calendário pessoal
  - [x] Widget: próximo trabalho agendado
  - [x] Widget: últimas notificações

**🔵 REFACTOR**
- [x] Confirmar 100% dos testes passando

---

## Sessão 6 — Cadastro de Funcionários (CRUD)

**Model**
- [x] Criar `employee.model.ts`: interface `Employee`, schema Zod de criação/edição
- [x] Criar `salary-adjustment.model.ts`: interface `SalaryAdjustment`, schema Zod

**🔴 RED — Testes**
- [x] `employee.model.test.ts`: schema rejeita salário negativo, CNPJ inválido
- [x] `employee.viewmodel.test.ts`: `create()`, `update()`, `remove()` chamam o service e atualizam o store
- [x] `employee.viewmodel.test.ts`: busca com filtro retorna somente resultados esperados
- [x] `EmployeeForm.test.tsx`: exibe erros de validação nos campos corretos
- [x] `SalaryAdjustmentForm.test.tsx`: calcula e exibe a diferença de salário

**🟢 GREEN — Implementação**
- [x] Criar `employee.service.ts` (Axios CRUD)
- [x] Criar `employee.viewmodel.ts` (Zustand)
- [x] View `EmployeeListPage`: listagem com busca e paginação
- [x] View `EmployeeFormPage`: criação/edição com validação Zod
- [x] Modal de confirmação para exclusão
- [x] Aba: histórico de trabalhos realizados
- [x] Aba: histórico de reajustes de salário + formulário de novo reajuste

**🔵 REFACTOR**
- [x] Confirmar 100% dos testes passando

---

## Sessão 7 — Cadastro de Máquinas (CRUD)

**Model**
- [x] Criar `machine.model.ts`: interface `Machine`, schema Zod

**🔴 RED — Testes**
- [x] `machine.model.test.ts`: schema rejeita ano inválido, campos obrigatórios ausentes
- [x] `machine.viewmodel.test.ts`: `create()`, `update()`, `remove()` atualizam o store
- [x] `machine.viewmodel.test.ts`: upload do manual retorna URL e salva no model
- [x] `MachineForm.test.tsx`: exibe preview do nome do arquivo após seleção

**🟢 GREEN — Implementação**
- [x] Criar `machine.service.ts` (Axios CRUD + upload)
- [x] Criar `machine.viewmodel.ts` (Zustand)
- [x] View `MachineListPage`: listagem com busca
- [x] View `MachineFormPage`: criação/edição + upload de manual PDF
- [x] Aba: histórico de trabalhos na máquina (quem, quando, onde)
- [x] Modal de confirmação para exclusão

**🔵 REFACTOR**
- [x] Confirmar 100% dos testes passando

---

## Sessão 8 — Cadastro de Contratos (CRUD)

**Model**
- [x] Criar `contract.model.ts`: interface `Contract`, schema Zod, helper `getContractStatus()`

**🔴 RED — Testes**
- [x] `contract.model.test.ts`: `getContractStatus()` retorna `active | expiring | expired` corretamente
- [x] `contract.model.test.ts`: schema rejeita CNPJ inválido, datas inconsistentes
- [x] `contract.viewmodel.test.ts`: `create()`, `update()`, `remove()` atualizam o store
- [x] `ContractList.test.tsx`: exibe badge correto por status de vencimento

**🟢 GREEN — Implementação**
- [x] Criar `contract.service.ts` (Axios CRUD + upload)
- [x] Criar `contract.viewmodel.ts` (Zustand)
- [x] View `ContractListPage`: listagem com status de vencimento (ativo, a vencer, vencido)
- [x] View `ContractFormPage`: criação/edição + upload do PDF do contrato
- [x] Badge visual de alerta para contratos próximos ao vencimento
- [x] Modal de confirmação para exclusão

**🔵 REFACTOR**
- [x] `getContractStatus()` vive no Model, não na View
- [x] Confirmar 100% dos testes passando

---

## Sessão 9 — Gestão de Trabalhos — Criação (Manager/Admin)

**Model**
- [x] Criar `job.model.ts`: interface `Job`, schemas Zod por etapa do stepper, enum `JobType`, `JobStatus`

**🔴 RED — Testes**
- [x] `job.model.test.ts`: schema de cada etapa valida/rejeita corretamente
- [x] `job.viewmodel.test.ts`: `create()`, `update()`, `cancel()` atualizam o store
- [x] `job.viewmodel.test.ts`: filtros por status, funcionário e data retornam resultados esperados
- [x] `JobStepper.test.tsx`: não avança etapa se a atual for inválida
- [x] `JobStepper.test.tsx`: revisão da etapa 4 exibe todos os dados preenchidos

**🟢 GREEN — Implementação**
- [x] Criar `job.service.ts` (Axios CRUD)
- [x] Criar `job.viewmodel.ts` (Zustand)
- [x] View `JobListPage`: listagem com filtros (status, funcionário, data, tipo)
- [x] View `JobFormPage`: stepper em 4 etapas:
  - [x] Etapa 1: Funcionário + data no calendário
  - [x] Etapa 2: Local (cidade, estado, hospedagem, carro + horários)
  - [x] Etapa 3: Máquina + tipo de trabalho + descrição
  - [x] Etapa 4: Revisão e confirmação
- [x] Ação de editar trabalho existente
- [x] Modal de confirmação para cancelamento

**🔵 REFACTOR**
- [x] Confirmar 100% dos testes passando

---

## Sessão 10 — Tela de Trabalho — Leitura (Employee)

**Model**
- [x] Extender `job.model.ts`: tipos para histórico de manutenção e boas práticas de implementação

**🔴 RED — Testes**
- [x] `job.viewmodel.test.ts`: `fetchMyJobs()` retorna apenas trabalhos do usuário logado
- [x] `JobDetailView.test.tsx`: exibe histórico se `job_type === 'maintenance'`
- [x] `JobDetailView.test.tsx`: exibe boas práticas se `job_type === 'implementation'`
- [x] `JobDetailView.test.tsx`: botão "Finalizar" navega para a tela de finalização

**🟢 GREEN — Implementação**
- [x] View `EmployeeJobListPage`: listagem dos próprios trabalhos com filtro
- [x] View `EmployeeJobDetailPage`:
  - [x] Informações do trabalho
  - [x] Visualizador do manual da máquina (PDF embed)
  - [x] Se manutenção: histórico anterior
  - [x] Se implementação: boas práticas e pontos de atenção
  - [x] Sugestões de roteiro pós-trabalho (cidade/estado)
  - [x] Botão "Finalizar Trabalho"

**🔵 REFACTOR**
- [x] Lógica condicional de exibição (manutenção vs implementação) no ViewModel
- [x] Confirmar 100% dos testes passando

---

## Sessão 11 — Finalização de Trabalho

**Model**
- [x] Criar `job-report.model.ts`: interface `JobReport`, schema Zod, tipos de evidência

**🔴 RED — Testes**
- [x] `job-report.model.test.ts`: schema rejeita relatório vazio, tipo de arquivo inválido
- [x] `job-report.viewmodel.test.ts`: `submit()` chama o service com relatório + evidências e atualiza status do job
- [x] `RichTextEditor.test.tsx`: renderiza toolbar e aceita entrada de texto
- [x] `EvidenceUpload.test.tsx`: aceita tipos válidos, rejeita inválidos, permite remoção

**🟢 GREEN — Implementação**
- [x] Criar `job-report.service.ts` (Axios: submit relatório + upload de evidências)
- [x] Criar `job-report.viewmodel.ts` (Zustand)
- [x] View `JobFinalizationPage`:
  - [x] Editor rich text TipTap (negrito, itálico, sublinhado, listas, títulos H1-H3, toolbar DaisyUI)
  - [x] Upload de evidências (jpg, png, PDF, mp4, mp3) com preview e remoção individual
  - [x] Botão de submissão com loading state
  - [x] Confirmação de envio bem-sucedido

**🔵 REFACTOR**
- [x] Confirmar 100% dos testes passando

---

## Sessão 12 — Trabalho Finalizado (Manager/Admin)

**Model**
- [x] Extender `job-report.model.ts`: helper `buildPdfData()` que estrutura os dados para o PDF

**🔴 RED — Testes**
- [x] `job-report.model.test.ts`: `buildPdfData()` retorna estrutura correta com todos os campos
- [x] `JobReportView.test.tsx`: renderiza HTML do TipTap corretamente
- [x] `EvidenceList.test.tsx`: exibe preview para imagens e ícone para demais tipos
- [x] `GeneratePdfButton.test.tsx`: chama `buildPdfData()` ao clicar

**🟢 GREEN — Implementação**
- [x] View `ManagerJobDetailPage`: nova aba "Finalizado"
  - [x] Relatório renderizado (HTML do TipTap)
  - [x] Lista de evidências com preview/ícone e download individual
  - [x] Botão "Gerar PDF":
    - [x] Cabeçalho: dados do trabalho
    - [x] Corpo: relatório formatado
    - [x] Rodapé: data e nome do funcionário

**🔵 REFACTOR**
- [x] `buildPdfData()` vive no Model, não na View
- [x] Confirmar 100% dos testes passando

---

## Sessão 13 — Financeiro (CRUD)

**Model**
- [x] Criar `transaction.model.ts`: interface `Transaction`, schema Zod, helpers `calcSummary()`, `groupByMonth()`

**🔴 RED — Testes**
- [x] `transaction.model.test.ts`: `calcSummary()` calcula entradas, saídas e saldo corretamente
- [x] `transaction.model.test.ts`: `groupByMonth()` agrupa transações por mês
- [x] `transaction.model.test.ts`: schema rejeita valor zero ou negativo
- [x] `transaction.viewmodel.test.ts`: filtros combinados retornam somente resultados esperados
- [x] `FinancialSummaryCards.test.tsx`: exibe valores formatados com R$

**🟢 GREEN — Implementação**
- [x] Criar `transaction.service.ts` (Axios CRUD)
- [x] Criar `transaction.viewmodel.ts` (Zustand): estado + filtros reativos
- [x] View `FinancialPage`:
  - [x] Cards: total entradas, saídas, saldo do período
  - [x] Filtros: mês/período, tipo, destino
  - [x] Gráfico de linha: evolução mensal (Recharts)
  - [x] Gráfico de pizza: distribuição por categoria (Recharts)
  - [x] Listagem de transações
  - [x] Formulário de lançamento (Débito/Crédito, valor, descrição, destino, data)
  - [x] Modal de confirmação para exclusão

**🔵 REFACTOR**
- [x] `calcSummary()` e `groupByMonth()` vivem no Model
- [x] Confirmar 100% dos testes passando

---

## Sessão 14 — Chat com IA (Employee)

**Model**
- [x] Criar `chat.model.ts`: interface `ChatMessage`, `ChatSession`, schema Zod do input

**🔴 RED — Testes**
- [x] `chat.viewmodel.test.ts`: `sendMessage()` adiciona mensagem do usuário, chama service e adiciona resposta
- [x] `chat.viewmodel.test.ts`: estado de `loading` é `true` durante chamada e `false` ao concluir
- [x] `chat.viewmodel.test.ts`: em caso de erro, `retryLastMessage()` reenvia a última mensagem
- [x] `ChatBubble.test.tsx`: exibe lado esquerdo para IA e direito para usuário
- [x] `TypingIndicator.test.tsx`: visível quando `loading === true`

**🟢 GREEN — Implementação**
- [x] Criar `chat.service.ts` (Axios: POST para o endpoint RAG do backend)
- [x] Criar `chat.viewmodel.ts` (Zustand): histórico, loading, erro, retry
- [x] View `ChatPage`:
  - [x] Seleção de máquina
  - [x] Interface de chat (bolhas, input, botão enviar)
  - [x] Indicador de "digitando..."
  - [x] Aviso: *"Respostas baseadas apenas no manual da máquina selecionada"*
  - [x] Estado de erro com botão de retry

**🔵 REFACTOR**
- [x] Confirmar 100% dos testes passando

---

## Sessão 15 — Notificações In-App

**Model**
- [x] Criar `notification.model.ts`: interface `Notification`, helper `countUnread()`

**🔴 RED — Testes**
- [x] `notification.model.test.ts`: `countUnread()` retorna contagem correta
- [x] `notification.viewmodel.test.ts`: `markAsRead()` e `markAllAsRead()` atualizam o store
- [x] `notification.viewmodel.test.ts`: Realtime listener adiciona notificação ao store
- [x] `NotificationBell.test.tsx`: exibe badge com contagem de não-lidas

**🟢 GREEN — Implementação**
- [x] Criar `notification.service.ts` (Axios + Supabase Realtime)
- [x] Criar `notification.viewmodel.ts` (Zustand)
- [x] View `NotificationDropdown`: sino na navbar, lista de notificações, marcar como lida

**🔵 REFACTOR**
- [x] Confirmar 100% dos testes passando

---

## Sessão 16 — Testes E2E (Cypress)

- [x] Configurar `cypress/fixtures` com dados de seed (usuários, trabalhos, máquinas)
- [x] Fluxo: login como manager → criar trabalho → verificar no dashboard
- [x] Fluxo: login como employee → visualizar trabalho → finalizar com relatório e evidência
- [x] Fluxo: login como manager → visualizar trabalho finalizado → gerar PDF
- [x] Fluxo: login como manager → criar funcionário → editar → excluir
- [x] Fluxo: login como manager → lançar transação → verificar nos gráficos
- [x] Fluxo: login como employee → usar chat de IA com uma máquina
- [x] Fluxo: notificação aparece após criação de trabalho

---

## Sessão 17 — Polish & Deploy

- [x] Revisão de responsividade (mobile-first em todas as telas)
- [x] Error Boundary global
- [x] Skeleton loaders em todas as listagens
- [x] Estados vazios (empty states) com mensagem clara
- [x] Toasts de feedback (sucesso, erro, aviso) — DaisyUI `toast`
- [x] Revisão de acessibilidade (labels, aria, contraste)
- [x] Variáveis de ambiente de produção (`.env.production`)
- [x] Build de produção sem erros (`npm run build`)
- [x] Deploy na Vercel ou Netlify
- [x] Smoke test pós-deploy nos fluxos principais
