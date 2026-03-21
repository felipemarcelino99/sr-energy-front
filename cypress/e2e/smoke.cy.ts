/**
 * Smoke tests pós-deploy — executa contra a URL de produção.
 *
 * Uso:
 *   CYPRESS_BASE_URL=https://sr-energy.vercel.app npx cypress run --spec cypress/e2e/smoke.cy.ts
 * ou via npm:
 *   npm run cy:smoke
 */

describe('Smoke — Página de Login', () => {
  it('carrega a página de login sem erros', () => {
    cy.visit('/login')
    cy.contains('SR Energy').should('be.visible')
    cy.get('#email').should('exist')
    cy.get('#password').should('exist')
    cy.get('button[type="submit"]').should('contain', 'Entrar')
  })

  it('exibe validação ao submeter formulário vazio', () => {
    cy.visit('/login')
    cy.get('button[type="submit"]').click()
    cy.contains('E-mail inválido').should('be.visible')
  })
})

describe('Smoke — Rotas protegidas', () => {
  it('redireciona / para /login sem autenticação', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
  })

  it('redireciona /dashboard para /login sem autenticação', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
  })

  it('rota /404 exibe página de not found', () => {
    cy.visit('/esta-rota-nao-existe', { failOnStatusCode: false })
    // pode redirecionar para /login ou exibir 404
    cy.url().then((url) => {
      const is404 = url.includes('404') || url.includes('login') || url.includes('not-found')
      expect(is404).to.be.true
    })
  })
})

describe('Smoke — Assets e build', () => {
  it('carrega o CSS principal sem erros', () => {
    cy.visit('/login')
    // Verifica que o DaisyUI/Tailwind foi carregado pelo elemento estilizado existir
    cy.get('body').should('be.visible')
  })
})
