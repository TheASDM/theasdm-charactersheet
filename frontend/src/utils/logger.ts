type Level = 'debug' | 'info' | 'warn' | 'error';
const env = import.meta.env.MODE;

function log(level: Level, ...args: unknown[]) {
  if (env === 'production' && level === 'debug') return;
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](...args);
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
