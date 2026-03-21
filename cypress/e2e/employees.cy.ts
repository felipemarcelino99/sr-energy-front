// Fluxo: login como manager → criar funcionário → editar → excluir

describe('Manager — CRUD de Funcionários', () => {
  beforeEach(() => {
    cy.loginAsManager()
  })

  it('lista os funcionários', () => {
    cy.visit('/employees')
    cy.fixture('employees').then((employees) => {
      cy.contains(employees[0].name).should('be.visible')
      cy.contains(employees[1].name).should('be.visible')
    })
  })

  it('cria um novo funcionário', () => {
    const newEmployee = {
      id: 'employee-uuid-new',
      name: 'Carlos Montador',
      email: 'carlos@srenergia.com.br',
      phone: '11988880001',
      role: 'employee',
      cnpj: null,
      salary: 4800,
      hiredAt: '2026-01-15',
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-15T10:00:00.000Z',
    }

    cy.intercept('POST', '**/employees**', {
      statusCode: 201,
      body: newEmployee,
    }).as('createEmployee')

    cy.visit('/employees/new')
    cy.contains('Novo Funcionário').should('be.visible')

    cy.get('input[id="name"], input[placeholder*="Nome"]').type(newEmployee.name)
    cy.get('input[id="email"], input[type="email"]').type(newEmployee.email)
    cy.get('input[id="phone"], input[placeholder*="Telefone"]').type(newEmployee.phone)
    cy.get('input[id="salary"], input[placeholder*="Salário"]').type(String(newEmployee.salary))
    cy.get('input[id="hiredAt"], input[type="date"]').type(newEmployee.hiredAt)

    cy.contains('Salvar').click()
    cy.wait('@createEmployee')
    cy.url().should('include', '/employees')
  })

  it('edita um funcionário existente', () => {
    cy.fixture('employees').then((employees) => {
      const emp = employees[0]
      const updated = { ...emp, name: 'João Técnico Sênior' }

      cy.intercept('GET', `**/employees/${emp.id}**`, { statusCode: 200, body: emp }).as('getEmployee')
      cy.intercept('PUT', `**/employees/${emp.id}**`, { statusCode: 200, body: updated }).as('updateEmployee')

      cy.visit(`/employees/${emp.id}/edit`)
      cy.wait('@getEmployee')

      cy.get('input[id="name"], input[placeholder*="Nome"]').clear().type('João Técnico Sênior')
      cy.contains('Salvar').click()
      cy.wait('@updateEmployee')
      cy.url().should('include', '/employees')
    })
  })

  it('exclui um funcionário após confirmação', () => {
    cy.fixture('employees').then((employees) => {
      const emp = employees[0]
      cy.intercept('DELETE', `**/employees/${emp.id}**`, { statusCode: 204, body: {} }).as('deleteEmployee')
      cy.intercept('GET', '**/employees**', { statusCode: 200, body: employees })

      cy.visit('/employees')
      cy.contains(emp.name).should('be.visible')

      // Click delete button for first employee
      cy.contains(emp.name)
        .closest('tr, li, [data-row]')
        .find('button')
        .contains(/excluir|deletar|remover/i)
        .click()

      // Confirm in modal
      cy.get('[role="dialog"], .modal-box')
        .find('button')
        .contains(/confirmar|sim|excluir/i)
        .click()

      cy.wait('@deleteEmployee')
    })
  })
})
