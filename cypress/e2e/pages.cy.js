describe('Content pages', () => {
  it('renders the About story', () => {
    cy.visit('/about.html')
    cy.get('.hero h1').should('contain.text', 'Our story')
    cy.get('.card-grid .card').should('have.length.at.least', 3)
  })

  it('renders the Journal index', () => {
    cy.visit('/blog.html')
    cy.get('.section-header h2').should('contain.text', 'The Journal')
    cy.get('.card-grid .card').should('have.length', 6)
  })

  it('renders the Contact form', () => {
    cy.visit('/contact.html')
    cy.get('form.form').should('exist')
    cy.get('form.form .btn-primary').should('contain.text', 'Send message')
  })
})
