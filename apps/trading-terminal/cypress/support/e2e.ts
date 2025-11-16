// Support file for e2e tests
import './commands'

// Disable uncaught exception handling for tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  return false
})
