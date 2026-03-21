// Fluxo: login como employee → visualizar trabalho → finalizar com relatório e evidência

describe('Employee — Visualização e Finalização de Trabalho', () => {
  beforeEach(() => {
    cy.loginAsEmployee()
  })

  it('lista os trabalhos do funcionário', () => {
    cy.fixture('jobs').then((jobs) => {
      const myJobs = jobs.filter((j: { employeeId: string }) => j.employeeId === 'employee-uuid-001')
      cy.intercept('GET', '**/my-jobs**', { statusCode: 200, body: myJobs }).as('getMyJobs')
      cy.intercept('GET', '**/jobs**', { statusCode: 200, body: myJobs })
    })

    cy.visit('/my-jobs')
    cy.contains('Meus Trabalhos').should('be.visible')
  })

  it('visualiza o detalhe de um trabalho agendado', () => {
    cy.fixture('jobs').then((jobs) => {
      const job = jobs[1] // scheduled job
      cy.intercept('GET', `**/jobs/${job.id}**`, { statusCode: 200, body: job }).as('getJob')
      cy.intercept('GET', '**/jobs**', { statusCode: 200, body: jobs })
      cy.intercept('GET', '**/machines**', { statusCode: 200, body: [] })
    })

    cy.visit('/my-jobs/job-uuid-002')
    cy.contains('Campinas').should('be.visible')
    cy.contains('Finalizar Trabalho').should('be.visible')
  })

  it('finaliza um trabalho com relatório e evidência', () => {
    cy.fixture('jobs').then((jobs) => {
      const job = jobs[1]
      cy.intercept('GET', `**/jobs/${job.id}**`, { statusCode: 200, body: job })
      cy.intercept('GET', '**/jobs**', { statusCode: 200, body: jobs })
      cy.intercept('GET', '**/machines**', { statusCode: 200, body: [] })
    })

    cy.intercept('POST', '**/job-reports**', {
      statusCode: 201,
      body: { id: 'report-new', jobId: 'job-uuid-002', content: '<p>Trabalho concluído.</p>' },
    }).as('submitReport')

    cy.visit('/jobs/job-uuid-002/finalize')
    cy.contains('Finalizar Trabalho').should('be.visible')

    // Type in the rich text editor
    cy.get('.ProseMirror, [contenteditable="true"]').first().click().type('Trabalho concluído com sucesso.')

    // Submit
    cy.contains('Enviar Relatório').click()
    cy.wait('@submitReport')
    cy.contains('enviado', { matchCase: false }).should('be.visible')
  })
})
