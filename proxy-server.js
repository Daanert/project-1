const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// Proxy API requests to Flask backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'  // Keep /api prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.url} -> http://localhost:5000${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}));

// Serve React static files
const buildPath = path.join(__dirname, 'frontend', 'build');
app.use(express.static(buildPath));

// All other requests go to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ${buildPath}`);
  console.log(`🔗 Proxying /api/* to http://localhost:5000/api/*\n`);
});
