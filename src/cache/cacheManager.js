// src/cache/cacheManager.js
const LRU = require('lru-cache');

const options = {
  max: 500,                  // Max 500 items
  ttl: 1000 * 60 * 5,         // 5 minutes TTL per item
};

const { LRUCache } = require('lru-cache');
const cache = new LRUCache(options);

exports.get = (key) => {
  return cache.get(key);
};

exports.set = (key, value) => {
  cache.set(key, value);
};

exports.has = (key) => {
  return cache.has(key);
};

exports.del = (key) => {
  cache.delete(key);
};
