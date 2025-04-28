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

const cacheHitCounter = new client.Counter({
    name: 'api_proxy_cache_hit_total',
    help: 'Total number of cache hits',
  });
  
  // NEW: Cache MISS Counter
  const cacheMissCounter = new client.Counter({
    name: 'api_proxy_cache_miss_total',
    help: 'Total number of cache misses',
  });

register.registerMetric(requestDuration);
register.registerMetric(requestCounter);
register.registerMetric(cacheHitCounter);
register.registerMetric(cacheMissCounter);

exports.recordRequest = (duration, statusCode) => {
  requestDuration.observe(duration / 1000);
  requestCounter.labels(statusCode.toString()).inc();
};

exports.recordCacheHit = () => {
    cacheHitCounter.inc();
  };
  
exports.recordCacheMiss = () => {
    cacheMissCounter.inc();
  };

  
exports.register = register;
