describe('Regreso desde la ficha del inmueble', () => {
  it('vuelve al catálogo usando el enlace de resultados', () => {
    cy.visit('/inmueble/1')
    cy.contains('a', 'Volver a resultados').click()
    cy.location('pathname').should('eq', '/')
    cy.contains('inmuebles encontrados', { timeout: 10000 }).should('be.visible')
  })
})
