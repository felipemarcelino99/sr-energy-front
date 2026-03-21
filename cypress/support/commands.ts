/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsManager(): Chainable<void>
      loginAsEmployee(): Chainable<void>
      stubApiDefaults(): Chainable<void>
    }
  }
}

function buildSupabaseAuthResponse(user: {
  id: string
  email: string
  name: string
  role: string
}) {
  return {
    access_token: 'fake-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'fake-refresh-token',
    user: {
      id: user.id,
      email: user.email,
      user_metadata: { role: user.role, name: user.name },
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00.000Z',
    },
  }
}

// Intercept Supabase getSession / getUser on every page load
function stubSupabaseSession(user: { id: string; email: string; name: string; role: string }) {
  cy.intercept('GET', '**/auth/v1/user', {
    statusCode: 200,
    body: {
      id: user.id,
      email: user.email,
      user_metadata: { role: user.role, name: user.name },
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00.000Z',
    },
  }).as('getUser')

  cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
    statusCode: 200,
    body: buildSupabaseAuthResponse(user),
  }).as('authToken')

  cy.intercept('POST', '**/auth/v1/logout', { statusCode: 204, body: {} }).as('logout')
}

Cypress.Commands.add('stubApiDefaults', () => {
  cy.fixture('machines').then((machines) => {
    cy.intercept('GET', '**/api/machines', { statusCode: 200, body: machines }).as('getMachines')
    cy.intercept('GET', '**/machines', { statusCode: 200, body: machines }).as('getMachinesAlt')
  })
  cy.fixture('employees').then((employees) => {
    cy.intercept('GET', '**/api/employees', { statusCode: 200, body: employees }).as('getEmployees')
    cy.intercept('GET', '**/employees', { statusCode: 200, body: employees }).as('getEmployeesAlt')
  })
  cy.fixture('jobs').then((jobs) => {
    cy.intercept('GET', '**/api/jobs', { statusCode: 200, body: jobs }).as('getJobs')
    cy.intercept('GET', '**/jobs', { statusCode: 200, body: jobs }).as('getJobsAlt')
  })
  cy.fixture('transactions').then((transactions) => {
    cy.intercept('GET', '**/api/transactions', { statusCode: 200, body: transactions }).as('getTransactions')
    cy.intercept('GET', '**/transactions', { statusCode: 200, body: transactions }).as('getTransactionsAlt')
  })
  cy.fixture('notifications').then((notifications) => {
    cy.intercept('GET', '**/api/notifications', { statusCode: 200, body: notifications }).as('getNotifications')
    cy.intercept('GET', '**/notifications', { statusCode: 200, body: notifications }).as('getNotificationsAlt')
    cy.intercept('GET', '**/rest/v1/notifications**', { statusCode: 200, body: notifications }).as('getNotificationsSupabase')
  })
})

Cypress.Commands.add('loginAsManager', () => {
  cy.fixture('users').then((users) => {
    const manager = users.manager
    stubSupabaseSession(manager)
    cy.stubApiDefaults()
    cy.visit('/login')
    cy.get('#email').type(manager.email)
    cy.get('#password').type(manager.password)
    cy.get('button[type="submit"]').click()
    cy.wait('@authToken')
    cy.url().should('not.include', '/login')
  })
})

Cypress.Commands.add('loginAsEmployee', () => {
  cy.fixture('users').then((users) => {
    const employee = users.employee
    stubSupabaseSession(employee)
    cy.stubApiDefaults()
    cy.visit('/login')
    cy.get('#email').type(employee.email)
    cy.get('#password').type(employee.password)
    cy.get('button[type="submit"]').click()
    cy.wait('@authToken')
    cy.url().should('not.include', '/login')
  })
})

export {}
