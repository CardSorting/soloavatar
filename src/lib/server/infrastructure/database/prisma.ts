import { PrismaClient } from '@prisma/client';
import logger from '../../shared/utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  const logConfig = process.env.NODE_ENV === 'development'
    ? [{ level: 'query' as const, emit: 'event' as const }]
    : [];

  const client = new PrismaClient({
    log: logConfig,
  });

  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e: any) => {
      logger.debug('Prisma Query', {
        query: e.query,
        durationMs: e.duration,
      });
    });
  }

  return client;
};

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;

