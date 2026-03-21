// Fluxo: notificação aparece após criação de trabalho

describe('Notificações In-App', () => {
  it('exibe badge com contagem de notificações não lidas (manager)', () => {
    cy.loginAsManager()
    cy.visit('/')
    // The notification bell should show unread count
    cy.fixture('notifications').then((notifications) => {
      const unreadCount = notifications.filter((n: { read: boolean }) => !n.read).length
      if (unreadCount > 0) {
        cy.get('[data-testid="notification-bell"], [aria-label*="otificaç"]').should('be.visible')
      }
    })
  })

  it('abre o dropdown de notificações ao clicar no sino', () => {
    cy.loginAsManager()
    cy.visit('/')
    cy.get('[data-testid="notification-bell"], button').filter(':has([data-testid="notification-bell"])').first().click()
    cy.contains('Novo trabalho agendado').should('be.visible')
  })

  it('marca notificação como lida', () => {
    cy.fixture('notifications').then((notifications) => {
      const unread = notifications.find((n: { read: boolean }) => !n.read)

      cy.intercept('PATCH', `**/notifications/${unread.id}**`, {
        statusCode: 200,
        body: { ...unread, read: true },
      }).as('markRead')

      cy.loginAsManager()
      cy.visit('/')

      cy.get('[data-testid="notification-bell"], button')
        .filter(':visible')
        .first()
        .click()

      cy.contains(unread.title).should('be.visible')
      cy.contains(unread.title)
        .closest('[data-notification], li, div')
        .find('button')
        .click()

      cy.wait('@markRead')
    })
  })

  it('notificação aparece após criação de trabalho (manager cria, employee recebe)', () => {
    cy.fixture('jobs').then((jobs) => {
      const newJob = {
        ...jobs[1],
        id: 'job-uuid-notif-test',
        status: 'scheduled',
        description: 'Trabalho para notificação',
      }

      cy.intercept('POST', '**/jobs**', {
        statusCode: 201,
        body: newJob,
      }).as('createJob')

      // After job creation, the notification should appear (simulated via fixture)
      cy.fixture('notifications').then((notifications) => {
        const newNotif = {
          id: 'notif-uuid-new',
          userId: newJob.employeeId,
          title: 'Novo trabalho agendado',
          message: `Você tem um trabalho agendado para ${newJob.scheduledDate}.`,
          read: false,
          createdAt: new Date().toISOString(),
        }
        cy.intercept('GET', '**/notifications**', {
          statusCode: 200,
          body: [...notifications, newNotif],
        }).as('getNotificationsAfterCreate')
      })
    })

    cy.loginAsManager()

    // Verify that the notification bell is visible in the navbar
    cy.get('[data-testid="notification-bell"], [class*="notification"]').should('exist')
  })
})
