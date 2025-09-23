import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, simple, colorize, printf } =
  winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logs directory if it doesn't exist
const logDir = 'logs';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp(), json()),
  defaultMeta: { service: 'dnd-character-sheet-api' },
  transports: [
    // Write to all logs with level `info` and below to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    })
  );
}

export default logger;
