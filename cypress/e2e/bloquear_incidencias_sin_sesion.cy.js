describe('Acceso a incidencias sin iniciar sesión', () => {
  it('redirige al login al intentar abrir incidencias sin autenticación', () => {
    cy.visit('/incidencias')
    cy.location('pathname').should('eq', '/login')
    cy.contains('Ingresa a tu cuenta').should('be.visible')
    cy.screenshot('AUTH-01-redireccion-ruta-protegida')
  })
})
