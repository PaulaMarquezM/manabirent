describe('Login cuando falta la configuración de Supabase', () => {
  it('informa el error de Supabase y vuelve a habilitar el formulario', () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type('qa@example.com')
    cy.get('input[type="password"]').type('ClaveSegura123')
    cy.contains('button', 'Ingresar').click()
    cy.contains('Faltan variables de Supabase', { timeout: 10000 }).should('be.visible')
    cy.contains('button', 'Ingresar').should('be.enabled')
    cy.screenshot('AUTH-04-error-controlado-supabase')
  })
})
