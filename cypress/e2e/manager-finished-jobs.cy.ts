// Fluxo: login como manager → visualizar trabalho finalizado → gerar PDF

describe('Manager — Trabalho Finalizado e PDF', () => {
  beforeEach(() => {
    cy.loginAsManager()
  })

  it('visualiza o trabalho finalizado com o relatório', () => {
    cy.fixture('jobs').then((jobs) => {
      const completedJob = jobs[0] // status: completed
      cy.intercept('GET', `**/jobs/${completedJob.id}**`, {
        statusCode: 200,
        body: completedJob,
      }).as('getJob')
      cy.intercept('GET', '**/jobs**', { statusCode: 200, body: jobs })
    })

    cy.fixture('job-report').then((report) => {
      cy.intercept('GET', `**/job-reports/job-uuid-001**`, { statusCode: 200, body: report }).as('getReport')
      cy.intercept('GET', `**/job-reports**`, { statusCode: 200, body: report })
    })

    cy.visit('/jobs/job-uuid-001')
    cy.contains('Finalizado').should('be.visible')
    cy.contains('Finalizado').click()
    cy.contains('Relatório de Manutenção').should('be.visible')
  })

  it('botão Gerar PDF está disponível no trabalho finalizado', () => {
    cy.fixture('jobs').then((jobs) => {
      cy.intercept('GET', `**/jobs/job-uuid-001**`, { statusCode: 200, body: jobs[0] })
      cy.intercept('GET', '**/jobs**', { statusCode: 200, body: jobs })
    })

    cy.fixture('job-report').then((report) => {
      cy.intercept('GET', '**/job-reports**', { statusCode: 200, body: report })
    })

    cy.visit('/jobs/job-uuid-001')
    cy.contains('Finalizado').click()
    cy.contains('Gerar PDF').should('be.visible')
  })
})
