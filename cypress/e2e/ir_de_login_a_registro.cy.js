describe('Enlaces entre login, registro e inicio', () => {
  it('navega del login al registro y permite regresar al acceso desde el catálogo', () => {
    cy.visit('/login')
    cy.contains('a', 'Regístrate aquí').click()
    cy.location('pathname').should('eq', '/registro')
    cy.contains('Crear Cuenta').should('be.visible')
    cy.visit('/')
    cy.get('a[href="/login"]').first().click()
    cy.location('pathname').should('eq', '/login')
  })
})
