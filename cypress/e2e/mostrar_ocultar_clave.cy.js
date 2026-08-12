describe('Botón para mostrar la contraseña', () => {
  it('alterna de forma reversible entre contraseña oculta y visible', () => {
    cy.visit('/login')
    cy.get('input[type="password"]').type('ClaveSegura123')
    cy.get('input[type="password"]').parent().find('button').click()
    cy.get('input[type="text"][value="ClaveSegura123"]').should('be.visible')
    cy.get('input[value="ClaveSegura123"]').parent().find('button').click()
    cy.get('input[type="password"]').should('have.value', 'ClaveSegura123')
  })
})
