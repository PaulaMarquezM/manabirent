describe('Vista previa del contrato', () => {
  it('muestra y vuelve a ocultar el contrato estándar', () => {
    cy.visit('/inmueble/1')
    cy.contains('button', 'Ver contrato estándar').click()
    cy.contains('CONTRATO DE ARRENDAMIENTO').should('be.visible')
    cy.contains('CANON MENSUAL:').should('be.visible')
    cy.contains('button', 'Ocultar contrato').click()
    cy.contains('CONTRATO DE ARRENDAMIENTO').should('not.exist')
  })
})
