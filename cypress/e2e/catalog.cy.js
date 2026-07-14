// The catalog flow: shop grid → product detail → cart.
// This is the file Variant B of the demo targets with `/percy:expand-coverage`
// (it has several distinct UI states that lack a visual checkpoint).

describe('Catalog', () => {
  it('lists every product on the shop page', () => {
    cy.visit('/products.html')
    cy.get('.section-header h2').should('contain.text', 'The Collection')
    cy.get('.product-grid .product-card').should('have.length', 8)
    cy.percySnapshot('Catalog — shop grid')
  })

  it('opens the Arc Table Lamp product detail', () => {
    cy.visit('/products.html')
    cy.get('a.product-card').first().click()
    cy.location('pathname').should('include', 'product-1.html')
    cy.get('.article h1').should('contain.text', 'Arc Table Lamp')
    cy.get('.article .price-large').should('contain.text', '$189')
  })

  it('shows the cart with its line items and total', () => {
    cy.visit('/cart.html')
    cy.get('.cart-row').should('have.length.at.least', 2)
    cy.get('.cart-total').should('contain.text', 'Subtotal')
  })
})
