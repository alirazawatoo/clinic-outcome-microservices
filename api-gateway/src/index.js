require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })
);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathFilter: '/api/auth',
  on: {
    error: (err, req, res) => {
      console.error('Auth proxy error:', err.message);
      res.status(502).json({
        success: false,
        message: 'Auth service is unavailable',
      });
    },
  },
});

const outcomeProxy = createProxyMiddleware({
  target: process.env.OUTCOME_SERVICE_URL,
  changeOrigin: true,
  pathFilter: '/api/outcomes',
  on: {
    error: (err, req, res) => {
      console.error('Outcome proxy error:', err.message);
      res.status(502).json({
        success: false,
        message: 'Outcome service is unavailable',
      });
    },
  },
});

app.use(authProxy);
app.use(outcomeProxy);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`  Auth Service   -> ${process.env.AUTH_SERVICE_URL}`);
  console.log(`  Outcome Service -> ${process.env.OUTCOME_SERVICE_URL}`);
});
