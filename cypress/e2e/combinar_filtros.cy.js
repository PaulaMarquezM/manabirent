describe('Filtros combinados del catálogo', () => {
  it('combina ciudad, tipo de inmueble y rango de precio', () => {
    cy.visit('/')
    cy.contains('inmuebles encontrados', { timeout: 10000 }).should('be.visible')
    cy.contains('button', 'Filtros').click()
    cy.get('#filter-city').select('Portoviejo')
    cy.get('#filter-type').select('habitacion')
    cy.get('#filter-min-price').type('160')
    cy.get('#filter-max-price').type('200')
    cy.contains('1 inmuebles encontrados').should('be.visible')
    cy.contains('Habitación con baño privado, Portoviejo norte').should('be.visible')
    cy.screenshot('CAT-03-filtros-combinados')
  })
})
