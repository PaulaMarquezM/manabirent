describe('Detalle de un inmueble', () => {
  it('abre la ficha seleccionada desde el catálogo', () => {
    cy.visit('/')
    cy.contains('7 inmuebles encontrados', { timeout: 10000 }).should('be.visible')
    cy.contains('a', 'Habitación amoblada cerca de ULEAM').click()
    cy.location('pathname').should('eq', '/inmueble/1')
    cy.get('h1').should('contain', 'Habitación amoblada cerca de ULEAM')
    cy.contains('Servicios incluidos').should('be.visible')
  })
})
