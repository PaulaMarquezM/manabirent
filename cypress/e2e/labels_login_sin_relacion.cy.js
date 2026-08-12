describe('Revisión de las etiquetas del login', () => {
  it('reproduce la ausencia de relaciones for/id entre etiquetas y campos', () => {
    cy.visit('/login')
    cy.contains('label', 'Correo electrónico').should('not.have.attr', 'for')
    cy.contains('label', 'Contraseña').should('not.have.attr', 'for')
    cy.get('input[type="email"]').should('not.have.attr', 'id')
    cy.get('input[type="password"]').should('not.have.attr', 'id')
    cy.screenshot('A11Y-02-etiquetas-login')
  })
})
