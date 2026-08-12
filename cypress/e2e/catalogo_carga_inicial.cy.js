describe('Carga inicial del catálogo', () => {
  it('presenta los inmuebles disponibles usando los datos de respaldo', () => {
    cy.visit('/')
    cy.contains('7 inmuebles encontrados', { timeout: 10000 }).should('be.visible')
    cy.contains('Habitación amoblada cerca de ULEAM').should('be.visible')
    cy.screenshot('CAT-01-catalogo-publico-disponible')
  })
})
