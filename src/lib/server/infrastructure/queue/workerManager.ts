/**
 * Worker Manager
 * Manages and starts all queue workers
 */

import { queueService } from './queueService';
import { startAvatarGenerationWorker } from './workers/avatarGenerationWorker';
import { startDropGenerationWorker } from './workers/dropGenerationWorker';
import logger from '../../shared/utils/logger';

let workersStarted = false;

/**
 * Start all queue workers
 */
export async function startWorkers(): Promise<void> {
  if (workersStarted) {
    logger.info('Workers already started');
    return;
  }

  try {
    // Initialize queue service first
    await queueService.initialize();

    // Start all workers
    await Promise.all([
      startAvatarGenerationWorker(),
      startDropGenerationWorker(),
    ]);

    workersStarted = true;
    logger.info('All queue workers started successfully');
  } catch (error: any) {
    logger.error('Failed to start workers', { error: error.message });
    throw error;
  }
}

/**
 * Stop all workers
 */
export async function stopWorkers(): Promise<void> {
  if (!workersStarted) {
    return;
  }

  try {
    await queueService.shutdown();
    workersStarted = false;
    logger.info('All queue workers stopped');
  } catch (error: any) {
    logger.error('Error stopping workers', { error: error.message });
    throw error;
  }
}

/**
 * Check if workers are running
 */
export function areWorkersRunning(): boolean {
  return workersStarted;
}

