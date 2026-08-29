import { createLogger, format, transports } from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // Automatically includes stack traces for Error objects
    isProduction
      ? format.json()
      : format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, stack, ...meta }) => {
            const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [${level}]: ${stack || message} ${metaString}`;
          })
        )
  ),
  transports: [new transports.Console()],
});

export default logger;