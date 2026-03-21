import pino from 'pino';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Create logs directory if it doesn't exist
const logsDir = './logs';
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Create logger with file and console output
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: 'info',
        options: {
          destination: join(logsDir, 'app.log'),
          colorize: false,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        }
      },
      {
        target: 'pino-pretty',
        level: process.env.LOG_LEVEL || 'error',
        options: {
          destination: 1, // stdout
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        }
      }
    ]
  }
});

export default logger;
