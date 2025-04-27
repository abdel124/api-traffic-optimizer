// src/logger/logger.js
exports.error = (...args) => {
    console.error('[ERROR]', ...args);
  };
  
  exports.info = (...args) => {
    console.log('[INFO]', ...args);
  };
  