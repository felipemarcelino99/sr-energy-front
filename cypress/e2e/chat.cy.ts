// Fluxo: login como employee → usar chat de IA com uma máquina

describe('Employee — Chat com IA', () => {
  beforeEach(() => {
    cy.loginAsEmployee()
  })

  it('exibe a página de chat com seleção de máquina', () => {
    cy.visit('/chat')
    cy.contains('Chat com IA').should('be.visible')
    cy.get('select').should('be.visible')
    cy.contains('Selecione uma máquina').should('be.visible')
  })

  it('exibe aviso ao selecionar uma máquina', () => {
    cy.fixture('machines').then((machines) => {
      cy.intercept('GET', '**/machines**', { statusCode: 200, body: machines })
    })

    cy.visit('/chat')
    cy.get('select').select(1)
    cy.contains('manual da máquina selecionada').should('be.visible')
  })

  it('envia uma mensagem e exibe a resposta da IA', () => {
    cy.fixture('machines').then((machines) => {
      cy.intercept('GET', '**/machines**', { statusCode: 200, body: machines })
    })

    cy.intercept('POST', '**/chat**', {
      statusCode: 200,
      body: { answer: 'Para fazer a manutenção, siga os passos do manual na seção 3.' },
    }).as('chatMessage')

    cy.visit('/chat')
    cy.get('select').select(1)

    cy.get('input[placeholder*="pergunta"]').type('Como fazer a manutenção?')
    cy.contains('Enviar').click()

    cy.wait('@chatMessage')

    cy.contains('Como fazer a manutenção?').should('be.visible')
    cy.contains('Para fazer a manutenção, siga os passos').should('be.visible')
  })

  it('exibe indicador de digitando enquanto aguarda resposta', () => {
    cy.fixture('machines').then((machines) => {
      cy.intercept('GET', '**/machines**', { statusCode: 200, body: machines })
    })

    cy.intercept('POST', '**/chat**', (req) => {
      req.reply((res) => {
        res.setDelay(500)
        res.send({ statusCode: 200, body: { answer: 'Resposta atrasada.' } })
      })
    }).as('chatDelayed')

    cy.visit('/chat')
    cy.get('select').select(1)
    cy.get('input[placeholder*="pergunta"]').type('Pergunta de teste')
    cy.contains('Enviar').click()

    cy.get('[data-testid="typing-indicator"]').should('be.visible')
    cy.wait('@chatDelayed')
    cy.get('[data-testid="typing-indicator"]').should('not.exist')
  })

  it('exibe botão de retry em caso de erro', () => {
    cy.fixture('machines').then((machines) => {
      cy.intercept('GET', '**/machines**', { statusCode: 200, body: machines })
    })

    cy.intercept('POST', '**/chat**', {
      statusCode: 500,
      body: { message: 'Internal Server Error' },
    }).as('chatError')

    cy.visit('/chat')
    cy.get('select').select(1)
    cy.get('input[placeholder*="pergunta"]').type('Pergunta que vai falhar')
    cy.contains('Enviar').click()

    cy.wait('@chatError')
    cy.contains('Tentar novamente').should('be.visible')
  })
})
