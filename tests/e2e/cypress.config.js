const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'tests/e2e/specs/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/e2e.js',

    // Timeout settings
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    execTimeout: 60000,

    // Video and screenshots
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',

    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Test environment
    env: {
      API_URL: 'http://localhost:8000',
      WEBSOCKET_URL: 'ws://localhost:8000',
      ADMIN_USERNAME: 'admin@example.com',
      ADMIN_PASSWORD: 'password123',
      TEST_USERNAME: 'trader@example.com',
      TEST_PASSWORD: 'password123',
    },

    // Number of parallel workers
    workers: 4,

    // Test data
    dataFixturesFolder: 'tests/e2e/fixtures',

    // Retries
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Other settings
    experimentalSessionSupport: true,
    chromeWebSecurity: false,
    requestTimeout: 10000,

    // Logging
    setupNodeEvents(on, config) {
      // Example task
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'tests/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/component.js',
  },
});
