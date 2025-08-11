const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { 
    service: 'farmerdm',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Add LogDNA transport if configured
if (process.env.LOGDNA_INGESTION_KEY) {
  try {
    const LogdnaWinston = require('winston-logdna');
    logger.add(new LogdnaWinston({
      key: process.env.LOGDNA_INGESTION_KEY,
      hostname: process.env.HOSTNAME || 'farmerdm',
      app: 'farmerdm',
      level: 'info',
      index_meta: true,
      include_standard_meta: false
    }));
  } catch (error) {
    console.warn('LogDNA transport not available:', error.message);
  }
}

// Add Papertrail transport if configured
if (process.env.PAPERTRAIL_URL) {
  try {
    const PapertrailTransport = require('winston-papertrail-transport');
    logger.add(new PapertrailTransport({
      host: process.env.PAPERTRAIL_URL.split(':')[0],
      port: parseInt(process.env.PAPERTRAIL_URL.split(':')[1]),
      hostname: process.env.HOSTNAME || 'farmerdm',
      program: 'farmerdm',
      level: 'info'
    }));
  } catch (error) {
    console.warn('Papertrail transport not available:', error.message);
  }
}

// Helper functions for structured logging
const logHelpers = {
  // Log API requests
  logRequest: (req, res, responseTime) => {
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous'
    });
  },

  // Log API errors
  logError: (error, req = null) => {
    logger.error('API Error', {
      message: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      userId: req?.user?.id || 'anonymous',
      ip: req?.ip || req?.connection?.remoteAddress
    });
  },

  // Log authentication events
  logAuth: (event, userId, success, details = {}) => {
    logger.info('Authentication Event', {
      event,
      userId,
      success,
      ...details
    });
  },

  // Log business events
  logBusiness: (event, userId, details = {}) => {
    logger.info('Business Event', {
      event,
      userId,
      ...details
    });
  },

  // Log performance metrics
  logPerformance: (operation, duration, details = {}) => {
    logger.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...details
    });
  },

  // Log security events
  logSecurity: (event, details = {}) => {
    logger.warn('Security Event', {
      event,
      ...details
    });
  }
};

// Export both logger and helpers
module.exports = {
  logger,
  ...logHelpers
};
