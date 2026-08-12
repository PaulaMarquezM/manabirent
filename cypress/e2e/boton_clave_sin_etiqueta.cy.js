describe('Revisión del botón de contraseña', () => {
  it('reproduce que el botón visual no tiene aria-label ni title', () => {
    cy.visit('/login')
    cy.get('input[type="password"]').parent().find('button').then(($button) => {
      expect($button).not.to.have.attr('aria-label')
      expect($button).not.to.have.attr('title')
    })
  })
})
