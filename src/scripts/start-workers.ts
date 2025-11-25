/**
 * Standalone Worker Script
 * Run this script to start queue workers in a separate process
 * 
 * Usage: npx tsx src/scripts/start-workers.ts
 * Or: node --loader ts-node/esm src/scripts/start-workers.ts
 */

import { startWorkers } from '../lib/server/infrastructure/queue/workerManager';
import logger from '../lib/server/shared/utils/logger';

async function main() {
  logger.info('Starting queue workers...');

  try {
    await startWorkers();
    logger.info('Queue workers started successfully. Press Ctrl+C to stop.');

    // Keep the process alive
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down workers...');
      const { stopWorkers } = await import('../lib/server/infrastructure/queue/workerManager');
      await stopWorkers();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down workers...');
      const { stopWorkers } = await import('../lib/server/infrastructure/queue/workerManager');
      await stopWorkers();
      process.exit(0);
    });
  } catch (error: any) {
    logger.error('Failed to start workers', { error: error.message });
    process.exit(1);
  }
}

main();

