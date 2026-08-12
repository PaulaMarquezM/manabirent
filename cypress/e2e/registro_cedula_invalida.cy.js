describe('Validación de cédula al registrarse', () => {
  it('rechaza una cédula con menos de diez dígitos', () => {
    cy.visit('/registro')
    cy.get('input[placeholder*="Juan"]').type('Juan Perez')
    cy.get('input[placeholder="130XXXXXXX"]').type('12345')
    cy.get('input[type="email"]').type('juan@example.com')
    cy.get('input[type="password"]').type('ClaveSegura123')
    cy.contains('button', 'Registrarse').click()
    cy.contains('La cédula debe tener 10 dígitos').should('be.visible')
  })
})
