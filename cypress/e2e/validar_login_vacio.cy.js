describe('Envío del login vacío', () => {
  it('impide enviar el login cuando el correo y la contraseña están vacíos', () => {
    cy.visit('/login')
    cy.contains('button', 'Ingresar').click()
    cy.get('input[type="email"]')
      .should('have.prop', 'validity')
      .its('valueMissing')
      .should('eq', true)
    cy.location('pathname').should('eq', '/login')
  })
})
