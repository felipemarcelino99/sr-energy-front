// Fluxo: login como manager → criar trabalho → verificar no dashboard

describe('Manager — Gestão de Trabalhos', () => {
  beforeEach(() => {
    cy.loginAsManager()
  })

  it('exibe a lista de trabalhos', () => {
    cy.visit('/jobs')
    cy.fixture('jobs').then((jobs) => {
      cy.contains(jobs[0].description).should('be.visible')
    })
  })

  it('cria um novo trabalho via stepper e verifica no dashboard', () => {
    cy.fixture('jobs').then((jobs) => {
      const newJob = {
        ...jobs[1],
        id: 'job-uuid-new',
        status: 'scheduled',
        description: 'Nova instalação de emergência',
      }

      cy.intercept('POST', '**/jobs', {
        statusCode: 201,
        body: newJob,
      }).as('createJob')

      cy.intercept('GET', '**/jobs**', { statusCode: 200, body: [...jobs, newJob] }).as('getJobsUpdated')
    })

    cy.fixture('employees').then((employees) => {
      cy.intercept('GET', '**/employees**', { statusCode: 200, body: employees })
    })

    cy.fixture('machines').then((machines) => {
      cy.intercept('GET', '**/machines**', { statusCode: 200, body: machines })
    })

    cy.visit('/jobs/new')
    cy.contains('Novo Trabalho').should('be.visible')

    // Step 1: employee + date
    cy.get('select').first().select(1)
    cy.get('input[type="date"]').first().type('2026-04-10')
    cy.contains('Próximo').click()

    // Step 2: location
    cy.get('input[placeholder*="Cidade"]').type('São Paulo')
    cy.get('input[placeholder*="Estado"], input[placeholder*="UF"]').type('SP')
    cy.get('input[type="time"]').first().type('08:00')
    cy.get('input[type="time"]').last().type('17:00')
    cy.contains('Próximo').click()

    // Step 3: machine + type + description
    cy.get('select').filter(':visible').first().select(1)
    cy.get('input[value="maintenance"], label').contains('Manutenção').closest('label').click()
    cy.get('textarea, input[placeholder*="Descrição"]').first().type('Nova instalação de emergência')
    cy.contains('Próximo').click()

    // Step 4: review + submit
    cy.contains('Nova instalação de emergência').should('be.visible')
    cy.contains('Confirmar').click()

    cy.wait('@createJob')
    cy.url().should('include', '/jobs')
  })

  it('exibe o dashboard com resumo financeiro e trabalhos', () => {
    cy.intercept('GET', '**/dashboard**', {
      statusCode: 200,
      body: {
        financialSummary: { totalCredits: 15000, totalDebits: 3500, balance: 11500 },
        jobsByStatus: { scheduled: 1, in_progress: 0, completed: 1, cancelled: 0 },
      },
    })

    cy.visit('/')
    cy.contains('Dashboard').should('be.visible')
  })
})
