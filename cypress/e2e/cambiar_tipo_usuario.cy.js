describe('Selección del tipo de usuario', () => {
  it('permite cambiar de inquilino a arrendador antes del registro', () => {
    cy.visit('/registro')
    cy.contains('button', 'Soy Inquilino').should('have.class', 'bg-primary-50')
    cy.contains('button', 'Soy Arrendador').click().should('have.class', 'bg-primary-50')
    cy.contains('button', 'Soy Inquilino').should('not.have.class', 'bg-primary-50')
  })
})
