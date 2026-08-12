describe('Validación del nombre al registrarse', () => {
  it('rechaza un nombre que contiene números', () => {
    cy.visit('/registro')
    cy.get('input[placeholder*="Juan"]').type('Juan123')
    cy.get('input[placeholder="130XXXXXXX"]').type('1301234567')
    cy.get('input[type="email"]').type('juan@example.com')
    cy.get('input[type="password"]').type('ClaveSegura123')
    cy.contains('button', 'Registrarse').click()
    cy.contains('El nombre solo debe contener letras.').should('be.visible')
  })
})
