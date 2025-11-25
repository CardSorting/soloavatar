/**
 * Standalone Worker Script
 * Run this script to start queue workers in a separate process
 * 
 * Note: For personal software, workers usually start automatically with the app.
 * This script is useful if you want to run workers separately or restart them.
 * 
 * Usage: npm run workers:start
 */

import { startWorkers } from '../lib/server/infrastructure/queue/workerManager';
import logger from '../lib/server/shared/utils/logger';

async function main() {
  console.log('🚀 Starting queue workers...');
  logger.info('Starting queue workers');

  try {
    await startWorkers();
    console.log('✅ Queue workers started successfully');
    console.log('   Workers are processing jobs. Press Ctrl+C to stop.');
    logger.info('Queue workers started successfully');

    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n⏹️  Shutting down workers...');
      logger.info('Received SIGINT, shutting down workers');
      const { stopWorkers } = await import('../lib/server/infrastructure/queue/workerManager');
      await stopWorkers();
      console.log('✅ Workers stopped');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down workers');
      const { stopWorkers } = await import('../lib/server/infrastructure/queue/workerManager');
      await stopWorkers();
      process.exit(0);
    });
  } catch (error: any) {
    console.error('❌ Failed to start workers:', error.message);
    logger.error('Failed to start workers', { error: error.message });
    console.error('\n💡 Make sure your database is running and DATABASE_URL is set correctly.');
    process.exit(1);
  }
}

main();

