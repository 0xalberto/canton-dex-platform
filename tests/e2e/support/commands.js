/**
 * Custom Cypress commands for CantonDEX testing.
 */

// Login command
Cypress.Commands.add('login', (username = Cypress.env('TEST_USERNAME'), password = Cypress.env('TEST_PASSWORD')) => {
  cy.visit('/login');
  cy.get('[data-testid="username-input"]').type(username);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

// Create order command
Cypress.Commands.add('createOrder', (symbol, side, quantity, price, type = 'LIMIT') => {
  cy.visit('/trading');
  cy.get('[data-testid="symbol-input"]').type(symbol);
  cy.get('[data-testid="side-select"]').select(side);
  cy.get('[data-testid="quantity-input"]').type(quantity);
  if (type === 'LIMIT') {
    cy.get('[data-testid="price-input"]').type(price);
  }
  cy.get('[data-testid="order-type-select"]').select(type);
  cy.get('[data-testid="submit-order-button"]').click();
  cy.get('[data-testid="order-confirmation"]').should('be.visible');

  // Return order ID
  cy.get('[data-testid="order-id"]').then($el => {
    return $el.text();
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Check authorization
Cypress.Commands.add('checkAuth', () => {
  cy.window().then(win => {
    const token = localStorage.getItem('authToken');
    expect(token).to.exist;
  });
});

// Wait for API response
Cypress.Commands.add('waitForAPI', (method, path, timeout = 5000) => {
  cy.intercept(method, `*${path}*`).as(`${method}_${path.replace(/\//g, '_')}`);
  cy.wait(`@${method}_${path.replace(/\//g, '_')}`, { timeout });
});

// Check element exists and is visible
Cypress.Commands.add('shouldExistAndBeVisible', (selector) => {
  cy.get(selector).should('exist').should('be.visible');
});

// Fill form
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([key, value]) => {
    cy.get(`[data-testid="${key}"]`).type(value);
  });
});

// Click and wait for navigation
Cypress.Commands.add('clickAndWait', (selector, path) => {
  cy.intercept('GET', path).as('pageLoad');
  cy.get(selector).click();
  cy.wait('@pageLoad');
});

// Verify error message
Cypress.Commands.add('shouldShowError', (message) => {
  cy.get('[data-testid="error-message"]').should('contain', message);
});

// Verify success message
Cypress.Commands.add('shouldShowSuccess', (message) => {
  cy.get('[data-testid="success-message"]').should('contain', message);
});

// Wait for loading spinner to disappear
Cypress.Commands.add('waitForLoadingToFinish', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
});

// Performance command
Cypress.Commands.add('measureLoadTime', () => {
  cy.window().then(win => {
    const navigationTiming = win.performance.timing;
    const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
    cy.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).to.be.lessThan(3000);
  });
});
