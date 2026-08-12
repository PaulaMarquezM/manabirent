describe('Formato del correo en el login', () => {
  it('no permite enviar una dirección de correo inválida', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type('correo-sin-dominio')
    cy.get('input[type="password"]').type('ClaveSegura123')
    cy.contains('button', 'Ingresar').click()
    cy.get('input[type="email"]')
      .should('have.prop', 'validity')
      .its('typeMismatch')
      .should('eq', true)
    cy.location('pathname').should('eq', '/login')
  })
})
