// src/server.js
require('dotenv').config();
const Fastify = require('fastify');
const proxyHandler = require('./proxy/proxyHandler');
const metrics = require('./metrics/metrics');
const compress = require('@fastify/compress');

const app = Fastify();

app.register(compress, {
    global: true, // Compress all responses unless excluded
    encodings: ['gzip', 'deflate', 'br'], // Gzip, Brotli, Deflate
  });

// Health Check
app.get('/health', async (req, reply) => {
  return { status: 'ok' };
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, reply) => {
  reply.header('Content-Type', metrics.register.contentType);
  return metrics.register.metrics();
});

// Proxy endpoint (example to OpenAI or any external API)
app.post('/proxy/:target', proxyHandler.forwardRequest);

// Start server
const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('API Traffic Optimizer Proxy listening on port 3000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
