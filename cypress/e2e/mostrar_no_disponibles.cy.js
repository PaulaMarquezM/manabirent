describe('Filtro de servicios y disponibilidad', () => {
  it('filtra por BBQ e incluye un inmueble no disponible al cambiar el criterio', () => {
    cy.visit('/')
    cy.contains('inmuebles encontrados', { timeout: 10000 }).should('be.visible')
    cy.contains('button', 'Filtros').click()
    cy.contains('label', 'BBQ').find('input').check()
    cy.contains('0 inmuebles encontrados').should('be.visible')
    cy.contains('label', 'Solo disponibles').find('input').uncheck()
    cy.contains('1 inmuebles encontrados').should('be.visible')
    cy.contains('Casa entera 3 habitaciones, Manta playa').should('be.visible')
  })
})
