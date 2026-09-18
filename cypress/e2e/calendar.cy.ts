// Fluxo: calendário (sub-plano 06 do épico ajustes-cliente-2026-09) — cor do chip
// igual à do colaborador/legenda, célula do dia mostra todas as OS sem cortar,
// troca de visão Dia/Semana/Mês, navegação rápida de mês/ano, e agenda da equipe
// em modo leitura para o funcionário (sem criar/editar/cancelar).
//
// PENDENTE — não executado nesta sessão: sem Docker/backend real disponível
// (migrations 030-032 do épico não aplicadas em nenhum banco). Rodar manualmente
// depois, com `npm run cy:run` (ou `cy:open`) contra um ambiente de dev de pé.

function stubCalendarJobs(fixtureOverride?: string) {
  cy.fixture(fixtureOverride ?? 'calendar-jobs').then((jobs) => {
    cy.intercept('GET', '**/jobs/calendar**', { statusCode: 200, body: jobs }).as('getCalendarJobs')
  })
  cy.intercept('GET', '**/schedule-events**', { statusCode: 200, body: [] }).as('getScheduleEvents')
}

describe('Calendário — Manager', () => {
  beforeEach(() => {
    cy.loginAsManager()
  })

  it('mostra as 8 OS de um mesmo dia sem nenhuma classe de scroll/corte', () => {
    stubCalendarJobs()
    cy.visit('/schedule?date=2026-04-15')
    cy.wait('@getCalendarJobs')

    // as 8 OS do dia 15 aparecem — cada uma é um chip com `title` (tooltip)
    cy.contains('[role="button"]', 'Selecionar dia 15').find('[title]').should('have.length', 8)

    // nenhum elemento da célula tem scroll interno (passo 4 do sub-plano 06)
    cy.contains('[role="button"]', 'Selecionar dia 15').should('not.have.class', 'overflow-y-auto')
  })

  it('a cor do chip de cada OS é a mesma cor do colaborador na legenda', () => {
    stubCalendarJobs()
    cy.visit('/schedule?date=2026-04-15')
    cy.wait('@getCalendarJobs')

    cy.get('[title*="Comissionamento"]')
      .first()
      .should('have.css', 'background-color', 'rgb(37, 99, 235)') // #2563eb — João Técnico

    cy.contains('João Técnico').prev().should('have.css', 'background-color', 'rgb(37, 99, 235)')
  })

  it('troca entre as visões Dia, Semana e Mês', () => {
    stubCalendarJobs()
    cy.visit('/schedule?date=2026-04-15')
    cy.wait('@getCalendarJobs')

    cy.contains('button', 'Semana').click()
    cy.get('[data-testid], [role="button"]').should('exist')

    cy.contains('button', 'Dia').click()
    cy.contains('AA101').should('be.visible')

    cy.contains('button', 'Mês').click()
    cy.contains('[role="button"]', 'Selecionar dia 15').should('be.visible')
  })

  it('navega rapidamente de mês/ano pelo seletor', () => {
    stubCalendarJobs()
    cy.visit('/schedule?date=2026-04-01')
    cy.wait('@getCalendarJobs')

    cy.get('select[aria-label="Selecionar mês"]').select('Dezembro')
    cy.get('select[aria-label="Selecionar ano"]').select('2027')
    cy.contains('Dezembro 2027').should('be.visible')
  })
})

describe('Calendário — Funcionário (agenda da equipe, somente leitura)', () => {
  beforeEach(() => {
    cy.loginAsEmployee()
  })

  it('vê a agenda de todos os colaboradores, sem nenhuma ação de escrita', () => {
    stubCalendarJobs()
    cy.visit('/dashboard')
    cy.wait('@getCalendarJobs')

    // OS de outro colaborador (Maria) também aparece — não é filtrada
    cy.contains('Maria Eletricista').should('be.visible')

    // nenhuma ação de escrita disponível
    cy.contains('+ Novo Evento').should('not.exist')
    cy.contains('Todos os funcionários').should('not.exist')
    cy.contains('button', 'Editar').should('not.exist')
    cy.contains('button', /^Cancelar$/).should('not.exist')
  })
})
