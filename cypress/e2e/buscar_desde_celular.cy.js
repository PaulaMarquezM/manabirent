describe('Búsqueda desde un celular', () => {
  it('mantiene operativa la búsqueda del catálogo en un viewport de teléfono', () => {
    cy.viewport('iphone-x')
    cy.visit('/')
    cy.contains('7 inmuebles encontrados', { timeout: 10000 }).should('be.visible')
    cy.get('input[placeholder*="parroquia"]').type('Manta Centro')
    cy.contains('1 inmuebles encontrados').should('be.visible')
    cy.screenshot('NAV-02-catalogo-vista-movil')
  })
})
