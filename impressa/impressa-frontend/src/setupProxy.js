const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      // Backend Express server runs on port 5000; use explicit IPv4 loopback
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
      secure: false,
    })
  );
};
