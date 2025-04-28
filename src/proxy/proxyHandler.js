const axios = require('axios');
const https = require('https');
const logger = require('../logger/logger');
const config = require('../config/config');
const metrics = require('../metrics/metrics');
const cacheManager = require('../cache/cacheManager');

// Setup a secure HTTPS Agent for SSL/TLS (important for Node.js v22+)
const secureAgent = new https.Agent({
  rejectUnauthorized: true,
  honorCipherOrder: true,
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
});

// Sleep utility for backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a cache key
const generateCacheKey = (url, body) => {
  return `${url}:${JSON.stringify(body)}`;
};

// Retry Wrapper with Exponential Backoff
const sendRequestWithRetry = async (options, maxRetries = 3, baseDelay = 100) => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await axios(options);
      return response;
    } catch (error) {
      attempt++;

      const status = error.response ? error.response.status : null;
      const retriable = !status || (status >= 500 && status < 600);

      if (attempt > maxRetries || !retriable) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      logger.error(`Retrying request (attempt ${attempt}) after ${delay}ms...`);
      await sleep(delay);
    }
  }
};

// MAIN Proxy Handler
exports.forwardRequest = async (request, reply) => {
  const targetService = request.params.target;
  const externalUrl = config.apiTargets[targetService];
  if (!externalUrl) {
    return reply.status(400).send({ error: 'Unknown target service' });
  }

  const cacheKey = generateCacheKey(externalUrl, request.body);

  // Check Cache First
  const cachedResponse = await cacheManager.get(cacheKey);
  if (cachedResponse) {
    logger.info(`Cache HIT for ${targetService}`);
    metrics.recordCacheHit();
    metrics.recordRequest(0.01, 200);
    return reply.send(cachedResponse);
  }
  metrics.recordCacheMiss();

  try {
    const start = Date.now();

    // ✨ Build Safe Headers manually
    const headers = {
      'Content-Type': 'application/json'
    };

    // Inject Authorization dynamically for OpenAI
    if (targetService === 'openai') {
      headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
    }
    console.log(headers)
    const response = await sendRequestWithRetry({
      method: 'post', // Always POST to OpenAI Completion API
      url: externalUrl,
      data: request.body, // Use client's body safely
      headers: headers,
      timeout: config.requestTimeoutMs,
      httpsAgent: secureAgent,
    }, config.maxRetries, config.retryBaseDelayMs);
    console.log(response)
    const duration = Date.now() - start;
    metrics.recordRequest(duration, 200);

    // Save into Redis Cache
    await cacheManager.set(cacheKey, response.data, config.cacheTtlSeconds);

    return reply.send(response.data);

  } catch (error) {
    logger.error(`Final failure forwarding to ${targetService}:`, error.message);
    metrics.recordRequest(0, error.response ? error.response.status : 500);

    return reply.status(error.response ? error.response.status : 500).send({
      error: error.message,
    });
  }
};
