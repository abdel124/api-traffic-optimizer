module.exports = {
    requestTimeoutMs: 5000, // 5 seconds
    maxRetries: 3,          // Max number of retries
    retryBaseDelayMs: 100,  // 100 ms base delay
    apiTargets: {
      openai: process.env.OPENAI_API_URL,
      stripe: process.env.STRIPE_API_URL,
      twilio: process.env.TWILIO_API_URL,
    },
  };