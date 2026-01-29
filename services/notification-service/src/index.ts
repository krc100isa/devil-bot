import { config } from 'dotenv';
import Redis from 'ioredis';
import { createLogger } from '@securechat/observability';

config();

const logger = createLogger(process.env.SERVICE_NAME ?? 'notification-service');
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const stream = 'notifications';
let lastId = '0-0';

const poll = async () => {
  const entries = await redis.xread('BLOCK', 1000, 'STREAMS', stream, lastId);
  if (entries) {
    for (const [, messages] of entries) {
      for (const [id, fields] of messages as [string, string[]][]) {
        lastId = id;
        const payload = JSON.parse(fields[fields.indexOf('payload') + 1]);
        logger.info({ payload }, 'notification event');
      }
    }
  }
  setImmediate(poll);
};

poll().catch((err) => logger.error(err, 'notification worker error'));
