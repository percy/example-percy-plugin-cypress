describe('Home page', () => {
  it('shows the hero and featured products', () => {
    cy.visit('/index.html')
    cy.get('.hero h1').should('contain.text', 'Considered objects')
    cy.get('.hero .btn-primary').should('contain.text', 'Shop the collection')
    cy.get('.product-grid .product-card').should('have.length', 4)
    cy.percySnapshot('Home — hero & featured')
  })

  it('links the hero CTA to the shop', () => {
    cy.visit('/index.html')
    cy.get('.hero .btn-primary').click()
    cy.location('pathname').should('include', 'products.html')
    cy.get('.section-header h2').should('contain.text', 'The Collection')
  })
})
