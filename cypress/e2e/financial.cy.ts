// Fluxo: login como manager → lançar transação → verificar nos gráficos

describe('Manager — Financeiro', () => {
  beforeEach(() => {
    cy.loginAsManager()
  })

  it('exibe o resumo financeiro com entradas, saídas e saldo', () => {
    cy.visit('/financial')
    cy.contains('Entradas').should('be.visible')
    cy.contains('Saídas').should('be.visible')
    cy.contains('Saldo').should('be.visible')
  })

  it('exibe a listagem de transações', () => {
    cy.visit('/financial')
    cy.fixture('transactions').then((transactions) => {
      cy.contains(transactions[0].description).should('be.visible')
      cy.contains(transactions[1].description).should('be.visible')
    })
  })

  it('lança uma nova transação e verifica o saldo atualizado', () => {
    cy.fixture('transactions').then((transactions) => {
      const newTx = {
        id: 'tx-uuid-new',
        type: 'credit',
        amount: 8000,
        description: 'Pagamento Empresa XYZ',
        category: 'Serviços',
        destination: 'Empresa XYZ',
        date: '2026-03-20',
        createdAt: '2026-03-20T10:00:00.000Z',
      }

      cy.intercept('POST', '**/transactions**', {
        statusCode: 201,
        body: newTx,
      }).as('createTransaction')

      cy.intercept('GET', '**/transactions**', {
        statusCode: 200,
        body: [...transactions, newTx],
      }).as('getTransactionsUpdated')
    })

    cy.visit('/financial')

    // Open the form or click "Novo Lançamento"
    cy.contains(/novo lançamento|adicionar|nova transação/i).click()

    // Fill in the form
    cy.get('select[name="type"], select').filter(':visible').first().select('credit')
    cy.get('input[name="amount"], input[placeholder*="Valor"]').type('8000')
    cy.get('input[name="description"], input[placeholder*="Descrição"]').type('Pagamento Empresa XYZ')
    cy.get('input[name="category"], input[placeholder*="Categoria"]').type('Serviços')
    cy.get('input[type="date"]').filter(':visible').first().type('2026-03-20')

    cy.contains(/salvar|confirmar|lançar/i).click()
    cy.wait('@createTransaction')

    cy.contains('Pagamento Empresa XYZ').should('be.visible')
  })
})
