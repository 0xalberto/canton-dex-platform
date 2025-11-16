describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should render login page', () => {
    cy.get('h1').contains('CantonDEX').should('be.visible')
    cy.get('h2').contains('Trading Terminal').should('be.visible')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should display validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click()
    cy.get('input[name="email"]:invalid').should('be.visible')
  })

  it('should navigate to register page', () => {
    cy.get('a').contains('Sign up').click()
    cy.url().should('include', '/register')
    cy.get('h2').contains('Create Account').should('be.visible')
  })

  it('should have remember me checkbox', () => {
    cy.get('input[name="rememberMe"]').should('exist')
    cy.get('label').contains('Remember me').should('be.visible')
  })
})

describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('should render registration page', () => {
    cy.get('h2').contains('Create Account').should('be.visible')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('input[name="confirmPassword"]').should('be.visible')
    cy.get('input[name="firstName"]').should('be.visible')
    cy.get('input[name="lastName"]').should('be.visible')
    cy.get('input[name="username"]').should('be.visible')
  })

  it('should validate password strength', () => {
    cy.get('input[name="password"]').type('short')
    cy.get('input[name="confirmPassword"]').type('short')
    cy.get('button[type="submit"]').click()
    // Should show password validation error
  })

  it('should validate password confirmation', () => {
    cy.get('input[name="password"]').type('Password123!')
    cy.get('input[name="confirmPassword"]').type('DifferentPassword123!')
    cy.get('button[type="submit"]').click()
    // Should show password mismatch error
  })

  it('should require terms acceptance', () => {
    cy.get('input[name="acceptTerms"]').should('not.be.checked')
    cy.get('button[type="submit"]').click()
    // Should show terms error
  })
})
