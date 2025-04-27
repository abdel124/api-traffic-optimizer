// src/proxy/proxyHandler.js
const axios = require('axios');
const logger = require('../logger/logger');
const config = require('../config/config');
const metrics = require('../metrics/metrics');

exports.forwardRequest = async (request, reply) => {
  const targetService = request.params.target;
  const externalUrl = config.apiTargets[targetService];

  if (!externalUrl) {
    return reply.status(400).send({ error: 'Unknown target service' });
  }

  try {
    const start = Date.now();

    const response = await axios({
      method: request.method,
      url: externalUrl,
      data: request.body,
      headers: { ...request.headers },
      timeout: config.requestTimeoutMs,
    });

    const duration = Date.now() - start;
    metrics.recordRequest(duration, 200);

    return reply.send(response.data);

  } catch (error) {
    logger.error(`Error forwarding to ${targetService}:`, error.message);
    metrics.recordRequest(0, error.response ? error.response.status : 500);

    return reply.status(error.response ? error.response.status : 500).send({
      error: error.message,
    });
  }
};
