const env = require('../config/env');

const logger = {
  info: (...args) => console.log('ℹ️ [INFO]', ...args),
  warn: (...args) => console.warn('⚠️ [WARN]', ...args),
  error: (...args) => console.error('❌ [ERROR]', ...args),
  debug: (...args) => {
    if (env.NODE_ENV === 'development') {
      console.log('🐛 [DEBUG]', ...args);
    }
  },
};

module.exports = logger;
