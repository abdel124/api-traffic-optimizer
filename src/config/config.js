// src/config/config.js
module.exports = {
    requestTimeoutMs: 5000, // 5 seconds timeout
    apiTargets: {
      openai: process.env.OPENAI_API_URL,
      stripe: process.env.STRIPE_API_URL,
      twilio: process.env.TWILIO_API_URL,
      // add more targets here
    },
  };