import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Log request
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - start;

    logger.info(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
      {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
      }
    );

    return originalEnd(chunk, encoding);
  };

  next();
};
