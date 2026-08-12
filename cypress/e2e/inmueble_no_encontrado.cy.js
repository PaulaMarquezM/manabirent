describe('Ruta de inmueble inexistente', () => {
  it('muestra un mensaje claro y permite volver al inicio', () => {
    cy.visit('/inmueble/99999')
    cy.contains('Inmueble no encontrado.').should('be.visible')
    cy.contains('a', 'Volver al inicio').click()
    cy.location('pathname').should('eq', '/')
  })
})
