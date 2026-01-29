import pino from 'pino';
import { collectDefaultMetrics, Registry } from 'prom-client';

export const createLogger = (serviceName: string) => {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service: serviceName }
  });
};

export const createMetricsRegistry = () => {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry });
  return registry;
};
