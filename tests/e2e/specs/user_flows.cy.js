/**
 * Critical user flow tests using Cypress
 */

describe('User Registration and Login Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should allow user to register new account', () => {
    cy.visit('/register');
    cy.get('[data-testid="username-input"]').type('newuser');
    cy.get('[data-testid="email-input"]').type('newuser@example.com');
    cy.get('[data-testid="password-input"]').type('SecurePassword123!');
    cy.get('[data-testid="confirm-password-input"]').type('SecurePassword123!');
    cy.get('[data-testid="terms-checkbox"]').check();
    cy.get('[data-testid="register-button"]').click();

    cy.url().should('include', '/onboarding');
    cy.get('[data-testid="welcome-message"]').should('exist');
  });

  it('should login with valid credentials', () => {
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type(Cypress.env('TEST_USERNAME'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_PASSWORD'));
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should show error on invalid login', () => {
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('invaliduser');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
  });

  it('should handle password reset', () => {
    cy.visit('/login');
    cy.get('[data-testid="forgot-password-link"]').click();

    cy.url().should('include', '/forgot-password');
    cy.get('[data-testid="email-input"]').type('user@example.com');
    cy.get('[data-testid="submit-button"]').click();

    cy.get('[data-testid="success-message"]').should('contain', 'Reset link sent');
  });
});

describe('Trading Flow', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/trading');
  });

  it('should create a buy order', () => {
    cy.get('[data-testid="order-form"]').should('be.visible');
    cy.get('[data-testid="symbol-input"]').type('EURUSD');
    cy.get('[data-testid="side-select"]').select('BUY');
    cy.get('[data-testid="quantity-input"]').type('1000000');
    cy.get('[data-testid="price-input"]').type('1.0950');
    cy.get('[data-testid="order-type-select"]').select('LIMIT');

    cy.get('[data-testid="submit-order-button"]').click();

    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="order-id"]').should('not.be.empty');
  });

  it('should create a market order', () => {
    cy.get('[data-testid="symbol-input"]').type('EURUSD');
    cy.get('[data-testid="side-select"]').select('SELL');
    cy.get('[data-testid="quantity-input"]').type('500000');
    cy.get('[data-testid="order-type-select"]').select('MARKET');

    cy.get('[data-testid="submit-order-button"]').click();
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
  });

  it('should display order in order book', () => {
    // Create an order
    cy.createOrder('EURUSD', 'BUY', 1000000, 1.0950, 'LIMIT');

    // Navigate to orders page
    cy.visit('/orders');
    cy.get('[data-testid="order-table"]').should('be.visible');
    cy.get('[data-testid="order-row"]').should('have.length.at.least', 1);
  });

  it('should cancel an order', () => {
    // Create an order
    const orderId = cy.createOrder('EURUSD', 'BUY', 1000000, 1.0950, 'LIMIT');

    // Cancel it
    cy.get(`[data-testid="cancel-button-${orderId}"]`).click();
    cy.get('[data-testid="confirm-cancel"]').click();

    cy.get('[data-testid="success-message"]').should('contain', 'Order cancelled');
  });

  it('should display portfolio positions', () => {
    cy.visit('/portfolio');
    cy.get('[data-testid="positions-table"]').should('be.visible');
    cy.get('[data-testid="position-row"]').should('have.length.at.least', 0);
    cy.get('[data-testid="total-value"]').should('contain', '$');
  });

  it('should show margin information', () => {
    cy.visit('/portfolio');
    cy.get('[data-testid="margin-section"]').should('be.visible');
    cy.get('[data-testid="margin-balance"]').should('contain', '$');
    cy.get('[data-testid="margin-used"]').should('contain', '%');
  });
});

describe('Account Management', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/account/settings');
  });

  it('should update user profile', () => {
    cy.get('[data-testid="first-name-input"]').clear().type('John');
    cy.get('[data-testid="last-name-input"]').clear().type('Doe');
    cy.get('[data-testid="save-button"]').click();

    cy.get('[data-testid="success-message"]').should('contain', 'Profile updated');
  });

  it('should enable two-factor authentication', () => {
    cy.get('[data-testid="mfa-toggle"]').click();
    cy.get('[data-testid="mfa-instructions"]').should('be.visible');

    // Scan QR code and enter code
    cy.get('[data-testid="mfa-code-input"]').type('123456');
    cy.get('[data-testid="verify-mfa-button"]').click();

    cy.get('[data-testid="success-message"]').should('contain', 'MFA enabled');
  });

  it('should change password', () => {
    cy.get('[data-testid="change-password-link"]').click();
    cy.get('[data-testid="current-password-input"]').type('OldPassword123!');
    cy.get('[data-testid="new-password-input"]').type('NewPassword456!');
    cy.get('[data-testid="confirm-password-input"]').type('NewPassword456!');
    cy.get('[data-testid="change-password-button"]').click();

    cy.get('[data-testid="success-message"]').should('contain', 'Password changed');
  });
});

describe('Compliance & Verification', () => {
  it('should complete KYC process', () => {
    cy.login();
    cy.visit('/kyc');

    // Personal information
    cy.get('[data-testid="first-name-input"]').type('John');
    cy.get('[data-testid="date-of-birth-input"]').type('1990-01-15');
    cy.get('[data-testid="next-button"]').click();

    // Address information
    cy.get('[data-testid="street-input"]').type('123 Main St');
    cy.get('[data-testid="city-input"]').type('New York');
    cy.get('[data-testid="zip-input"]').type('10001');
    cy.get('[data-testid="next-button"]').click();

    // Document upload
    cy.get('[data-testid="document-upload"]').attachFile('passport.pdf');
    cy.get('[data-testid="submit-kyc-button"]').click();

    cy.get('[data-testid="kyc-pending-message"]').should('be.visible');
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should handle network errors gracefully', () => {
    cy.intercept('POST', '/api/orders', { forceNetworkError: true });
    cy.visit('/trading');
    cy.createOrder('EURUSD', 'BUY', 1000000, 1.0950, 'LIMIT');

    cy.get('[data-testid="error-message"]').should('contain', 'Failed to create order');
  });

  it('should handle server errors', () => {
    cy.intercept('GET', '/api/portfolio', { statusCode: 500 });
    cy.visit('/portfolio');

    cy.get('[data-testid="error-message"]').should('contain', 'Server error');
  });
});

describe('Performance Tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should load dashboard within acceptable time', () => {
    cy.visit('/dashboard');
    // Navigation should be fast
    cy.window().then((win) => {
      const navigationTiming = win.performance.timing;
      const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
      expect(loadTime).to.be.lessThan(3000); // 3 seconds
    });
  });

  it('should render order book quickly', () => {
    cy.visit('/trading');
    cy.get('[data-testid="order-book"]').should('be.visible');
    // Check that book rendered in reasonable time
    cy.window().then((win) => {
      const start = win.performance.now();
      // Wait for data to render
      cy.get('[data-testid="bid-order"]').should('have.length.at.least', 1);
      const end = win.performance.now();
      expect(end - start).to.be.lessThan(1000); // 1 second
    });
  });
});

describe('WebSocket Connectivity', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/trading');
  });

  it('should receive real-time price updates', () => {
    cy.window().then((win) => {
      let priceUpdates = 0;
      win.addEventListener('message', () => {
        priceUpdates++;
      });

      cy.wait(2000);
      expect(priceUpdates).to.be.greaterThan(0);
    });
  });

  it('should maintain WebSocket connection', () => {
    // Keep page open for 30 seconds
    cy.wait(30000);
    cy.get('[data-testid="connection-status"]').should('contain', 'Connected');
  });
});
