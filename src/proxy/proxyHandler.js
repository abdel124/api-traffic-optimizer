const axios = require('axios');
const logger = require('../logger/logger');
const config = require('../config/config');
const metrics = require('../metrics/metrics');

// Exponential Backoff Helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry Wrapper

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

      const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
      logger.error(`Retrying request (attempt ${attempt}) after ${delay}ms...`);
      await sleep(delay);
    }
  }
};

exports.forwardRequest = async (request, reply) => {
  const targetService = request.params.target;
  const externalUrl = config.apiTargets[targetService];

  if (!externalUrl) {
    return reply.status(400).send({ error: 'Unknown target service' });
  }

  try {
    const start = Date.now();

    const response = await sendRequestWithRetry({
        method: request.method,
        url: externalUrl,
        data: request.body,
        headers: { ...request.headers },
        timeout: config.requestTimeoutMs,
      }, config.maxRetries, config.retryBaseDelayMs);

    const duration = Date.now() - start;
    metrics.recordRequest(duration, 200);

    return reply.send(response.data);

  } catch (error) {
    logger.error(`Final failure forwarding to ${targetService}:`, error.message);
    metrics.recordRequest(0, error.response ? error.response.status : 500);

    return reply.status(error.response ? error.response.status : 500).send({
      error: error.message,
    });
  }
};
