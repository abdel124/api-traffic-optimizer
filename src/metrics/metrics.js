// src/metrics/metrics.js
const client = require('prom-client');
const register = new client.Registry();

const requestDuration = new client.Histogram({
  name: 'api_proxy_request_duration_seconds',
  help: 'Duration of API requests',
  buckets: [0.1, 0.5, 1, 2, 5],
});

const requestCounter = new client.Counter({
  name: 'api_proxy_request_total',
  help: 'Total number of requests',
  labelNames: ['status'],
});

register.registerMetric(requestDuration);
register.registerMetric(requestCounter);

exports.recordRequest = (duration, statusCode) => {
  requestDuration.observe(duration / 1000);
  requestCounter.labels(statusCode.toString()).inc();
};

exports.register = register;
