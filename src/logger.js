import pino from 'pino';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory (where package.json is)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Create logs directory in project root if it doesn't exist
const logsDir = join(projectRoot, 'logs');
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
