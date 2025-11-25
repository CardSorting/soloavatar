/**
 * Health Monitoring Service
 * Provides comprehensive health checks and metrics for the application
 */

import { DatabaseUtils } from '../database/prisma';
import { StorageService } from '../storage/storageService';
import { config } from '../config';
import logger from '../../shared/utils/logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  components: {
    database: ComponentHealth;
    storage: ComponentHealth;
  };
  metrics?: {
    database?: any;
    storage?: any;
    performance?: any;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: any;
}

export class HealthService {
  /**
   * Get comprehensive health status
   */
  static async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const components: HealthStatus['components'] = {
      database: await this.checkDatabase(),
      storage: await this.checkStorage(),
    };

    // Determine overall status
    const statuses = Object.values(components).map(c => c.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    const health: HealthStatus = {
      status: overallStatus,
      timestamp,
      components,
    };

    // Add detailed metrics if healthy
    if (overallStatus === 'healthy') {
      try {
        health.metrics = {
          database: await DatabaseUtils.getPerformanceMetrics(),
          storage: await StorageService.getStorageStats(),
        };
      } catch (error: any) {
        logger.warn('Failed to get health metrics', { error: error.message });
      }
    }

    return health;
  }

  /**
   * Check database health
   */
  private static async checkDatabase(): Promise<ComponentHealth> {
    try {
      const health = await DatabaseUtils.getHealth();
      
      if (!health.connected) {
        return {
          status: 'unhealthy',
          message: 'Database connection failed',
        };
      }

      // Check if we can perform a simple query
      try {
        await DatabaseUtils.testConnection();
      } catch (error: any) {
        return {
          status: 'degraded',
          message: 'Database connection unstable',
          details: { error: error.message },
        };
      }

      // Check data integrity
      const integrity = await DatabaseUtils.checkDataIntegrity();
      if (!integrity.valid && integrity.issues.length > 0) {
        return {
          status: 'degraded',
          message: 'Data integrity issues detected',
          details: integrity.issues,
        };
      }

      return {
        status: 'healthy',
        details: {
          connected: health.connected,
          schemaVersion: health.schemaVersion,
          tableCount: health.tableCount,
        },
      };
    } catch (error: any) {
      logger.error('Database health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: `Database check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check storage health
   */
  private static async checkStorage(): Promise<ComponentHealth> {
    try {
      const stats = await StorageService.getStorageStats();
      const maxStorage = config.storage.maxTotalStorageGB * 1024 * 1024 * 1024;
      const usagePercent = (stats.totalSizeBytes / maxStorage) * 100;

      // Check if storage is nearly full
      if (usagePercent > 95) {
        return {
          status: 'unhealthy',
          message: 'Storage nearly full',
          details: {
            usedGB: stats.usedStorageGB.toFixed(2),
            maxGB: config.storage.maxTotalStorageGB,
            usagePercent: usagePercent.toFixed(1),
          },
        };
      }

      if (usagePercent > 80) {
        return {
          status: 'degraded',
          message: 'Storage usage high',
          details: {
            usedGB: stats.usedStorageGB.toFixed(2),
            maxGB: config.storage.maxTotalStorageGB,
            usagePercent: usagePercent.toFixed(1),
          },
        };
      }

      return {
        status: 'healthy',
        details: {
          totalFiles: stats.totalFiles,
          usedGB: stats.usedStorageGB.toFixed(2),
          maxGB: config.storage.maxTotalStorageGB,
          usagePercent: usagePercent.toFixed(1),
        },
      };
    } catch (error: any) {
      logger.error('Storage health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        message: `Storage check failed: ${error.message}`,
      };
    }
  }

  /**
   * Get quick health check (lightweight)
   */
  static async quickHealthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      const dbConnected = await DatabaseUtils.testConnection();
      if (!dbConnected) {
        return { healthy: false, message: 'Database not connected' };
      }

      // Quick storage check
      try {
        await StorageService.getStorageStats();
      } catch {
        return { healthy: false, message: 'Storage unavailable' };
      }

      return { healthy: true, message: 'All systems operational' };
    } catch (error: any) {
      return { healthy: false, message: `Health check failed: ${error.message}` };
    }
  }

  /**
   * Get system metrics for monitoring
   */
  static async getSystemMetrics(): Promise<{
    database: any;
    storage: any;
    performance: any;
  }> {
    try {
      const [dbMetrics, storageStats, dbPerformance] = await Promise.all([
        DatabaseUtils.getHealth(),
        StorageService.getStorageStats(),
        DatabaseUtils.getPerformanceMetrics().catch(() => ({})),
      ]);

      return {
        database: {
          connected: dbMetrics.connected,
          schemaVersion: dbMetrics.schemaVersion,
          tableCount: dbMetrics.tableCount,
          ...dbPerformance,
        },
        storage: storageStats,
        performance: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error('Failed to get system metrics', { error: error.message });
      throw error;
    }
  }
}

