describe('Autenticação', () => {
  beforeEach(() => {
    cy.fixture('users').as('users')
  })

  it('exibe a página de login', () => {
    cy.visit('/login')
    cy.contains('SR Energy').should('be.visible')
    cy.get('#email').should('exist')
    cy.get('#password').should('exist')
    cy.get('button[type="submit"]').contains('Entrar').should('exist')
  })

  it('exibe erros de validação para campos vazios', () => {
    cy.visit('/login')
    cy.get('button[type="submit"]').click()
    cy.contains('E-mail inválido').should('be.visible')
  })

  it('redireciona manager para o dashboard após login', () => {
    cy.loginAsManager()
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
  })

  it('redireciona employee para o dashboard após login', function () {
    cy.fixture('users').then((users) => {
      const employee = users.employee

      cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
        statusCode: 200,
        body: {
          access_token: 'fake-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh',
          user: {
            id: employee.id,
            email: employee.email,
            user_metadata: { role: employee.role, name: employee.name },
            aud: 'authenticated',
            created_at: '2024-01-01T00:00:00.000Z',
          },
        },
      }).as('authToken')

      cy.intercept('GET', '**/auth/v1/user', {
        statusCode: 200,
        body: {
          id: employee.id,
          email: employee.email,
          user_metadata: { role: employee.role, name: employee.name },
          aud: 'authenticated',
        },
      })

      cy.intercept('GET', '**/notifications**', { statusCode: 200, body: [] })
      cy.intercept('GET', '**/jobs**', { statusCode: 200, body: [] })

      cy.visit('/login')
      cy.get('#email').type(employee.email)
      cy.get('#password').type(employee.password)
      cy.get('button[type="submit"]').click()
      cy.wait('@authToken')
      cy.url().should('include', '/dashboard')
    })
  })

  it('exibe mensagem de erro para credenciais inválidas', () => {
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 400,
      body: { error: 'invalid_grant', error_description: 'Invalid login credentials' },
    }).as('loginFail')

    cy.visit('/login')
    cy.get('#email').type('errado@email.com')
    cy.get('#password').type('senha-errada')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginFail')
    cy.get('[role="alert"]').should('be.visible')
  })
})
