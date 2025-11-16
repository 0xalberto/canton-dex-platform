export const environment = {
  production: true,
  apiUrl: '/api',
  wsUrl: window.location.origin.replace(/^http/, 'ws'),
  features: {
    enableDevTools: false,
    enableLogging: false
  }
};
