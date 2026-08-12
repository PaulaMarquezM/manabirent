describe('Búsqueda por sector', () => {
  it('filtra por sector y recupera el catálogo al limpiar una búsqueda sin resultados', () => {
    cy.visit('/')
    cy.contains('inmuebles encontrados', { timeout: 10000 }).should('be.visible')
    cy.get('input[placeholder*="parroquia"]').type('Tarqui')
    cy.contains('1 inmuebles encontrados').should('be.visible')
    cy.contains('Habitación amoblada cerca de ULEAM').should('be.visible')

    cy.get('input[placeholder*="parroquia"]').clear().type('sector inexistente')
    cy.contains('Sin resultados').should('be.visible')
    cy.contains('button', 'Limpiar búsqueda').click()
    cy.contains('7 inmuebles encontrados').should('be.visible')
  })
})
