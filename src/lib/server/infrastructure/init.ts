/**
 * Application initialization
 * Sets up database connections, storage, and other infrastructure
 */

import { DatabaseUtils } from './database/prisma';
import { StorageService } from './storage/storageService';
import { HealthService } from './monitoring/healthService';
import { config } from './config';
import logger from '../shared/utils/logger';
import { startWorkers } from './queue/workerManager';

interface InitResult {
  success: boolean;
  components: {
    database: boolean;
    storage: boolean;
    queue?: boolean;
  };
  errors?: string[];
}

/**
 * Initialize all application infrastructure
 */
export async function initializeApplication(): Promise<InitResult> {
  const result: InitResult = {
    success: true,
    components: {
      database: false,
      storage: false,
      queue: false,
    },
    errors: [],
  };

  logger.info('Starting application initialization');

  try {
    // Initialize storage system
    logger.info('Initializing storage system');
    try {
      await StorageService.initialize();
      result.components.storage = true;
      logger.info('Storage system initialized successfully');
    } catch (error: any) {
      result.errors!.push(`Storage initialization failed: ${error.message}`);
      logger.error('Storage initialization failed', { error: error.message });
    }

    // Initialize database connection
    logger.info('Initializing database connection');
    try {
      const dbConnected = await DatabaseUtils.testConnection();
      if (dbConnected) {
        result.components.database = true;
        logger.info('Database connection initialized successfully');

        // Run auto-cleanup if enabled
        if (config.storage.enableAutoCleanup) {
          try {
            const cleanupResult = await StorageService.cleanup({
              dryRun: false,
              olderThanDays: config.storage.cleanupOlderThanDays,
            });
            if (cleanupResult.deleted.length > 0) {
              logger.info('Storage cleanup completed', {
                deletedFiles: cleanupResult.deleted.length,
                errors: cleanupResult.errors.length,
              });
            }
          } catch (cleanupError: any) {
            logger.warn('Storage cleanup failed', { error: cleanupError.message });
            // Don't fail initialization for cleanup errors
          }
        }
      } else {
        result.errors!.push('Database connection test failed');
        result.success = false;
      }
    } catch (error: any) {
      result.errors!.push(`Database initialization failed: ${error.message}`);
      result.success = false;
      logger.error('Database initialization failed', { error: error.message });
    }

    // Initialize queue service (optional - workers can be started separately)
    // Only start workers if ENABLE_WORKERS env var is set
    if (process.env.ENABLE_WORKERS === 'true') {
      logger.info('Initializing queue workers');
      try {
        await startWorkers();
        result.components.queue = true;
        logger.info('Queue workers initialized successfully');
      } catch (error: any) {
        result.errors!.push(`Queue initialization failed: ${error.message}`);
        logger.error('Queue initialization failed', { error: error.message });
        // Don't fail overall initialization if queue fails
      }
    } else {
      logger.info('Queue workers disabled (set ENABLE_WORKERS=true to enable)');
    }

    // Determine overall success
    result.success = result.components.database && result.components.storage;

    // Run initial health check
    if (result.success) {
      try {
        const health = await HealthService.quickHealthCheck();
        logger.info('Initial health check', health);
      } catch (healthError: any) {
        logger.warn('Initial health check failed', { error: healthError.message });
      }
    }

    logger.info('Application initialization completed', {
      success: result.success,
      database: result.components.database,
      storage: result.components.storage,
      queue: result.components.queue,
      errorCount: result.errors!.length,
    });

  } catch (error: any) {
    result.success = false;
    result.errors!.push(`Unexpected initialization error: ${error.message}`);
    logger.error('Unexpected application initialization error', { error: error.message });
  }

  return result;
}

/**
 * Get application health status
 */
export async function getApplicationHealth() {
  try {
    const healthStatus = await HealthService.getHealthStatus();
    return {
      ...healthStatus,
      initialized: healthStatus.status === 'healthy' || healthStatus.status === 'degraded',
    };
  } catch (error: any) {
    logger.error('Failed to get application health', { error: error.message });
    return {
      status: 'unhealthy' as const,
      timestamp: new Date().toISOString(),
      initialized: false,
      components: {
        database: { status: 'unhealthy' as const, message: 'Health check failed' },
        storage: { status: 'unhealthy' as const, message: 'Health check failed' },
      },
    };
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownApplication(): Promise<void> {
  logger.info('Starting application shutdown');

  try {
    // Stop workers if they were started
    if (process.env.ENABLE_WORKERS === 'true') {
      const { stopWorkers } = await import('./queue/workerManager');
      await stopWorkers();
    }

    await DatabaseUtils.shutdown();
    logger.info('Application shutdown completed');
  } catch (error: any) {
    logger.error('Application shutdown failed', { error: error.message });
    throw error;
  }
}
