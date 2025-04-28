require('dotenv').config();
const Fastify = require('fastify');
const compress = require('@fastify/compress');
const proxyHandler = require('./proxy/proxyHandler');
const metrics = require('./metrics/metrics');

// Create Fastify App
const app = Fastify({
  logger: true,
});

// Register Compression (gzip, brotli)
app.register(compress, {
  global: true,
  encodings: ['gzip', 'deflate', 'br'],
});

// Health Check Endpoint
app.get('/health', async (req, reply) => {
  return { status: 'ok' };
});

// Metrics Endpoint for Prometheus
app.get('/metrics', async (req, reply) => {
  reply.header('Content-Type', metrics.register.contentType);
  return metrics.register.metrics();
});

// Proxy Endpoint
app.post('/proxy/:target', proxyHandler.forwardRequest);

// Start Server
const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 API Traffic Optimizer Proxy listening on port 3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
