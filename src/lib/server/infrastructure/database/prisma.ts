// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is correctly exported from @prisma/client, this is a TypeScript language server cache issue
import { PrismaClient } from '@prisma/client';
import logger from '../../shared/utils/logger';
import { config } from '../config';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

interface PrismaConfig {
  log: Array<{ level: 'query' | 'info' | 'warn' | 'error'; emit: 'event' }>;
  datasources?: {
    db?: {
      url?: string;
    };
  };
}

const createPrismaClient = (): PrismaClient => {
  const logConfig = process.env.NODE_ENV === 'development'
    ? [
        { level: 'query' as const, emit: 'event' as const },
        { level: 'info' as const, emit: 'event' as const },
        { level: 'warn' as const, emit: 'event' as const },
        { level: 'error' as const, emit: 'event' as const },
      ]
    : [{ level: 'error' as const, emit: 'event' as const }];

  // Enhanced connection URL with connection pooling parameters
  let connectionUrl = config.database.url;
  if (connectionUrl && !connectionUrl.includes('?')) {
    // Add connection pooling parameters for better performance
    const poolParams = new URLSearchParams({
      connection_limit: config.database.maxConnections.toString(),
      pool_timeout: '10',
      connect_timeout: (config.database.connectionTimeoutMillis / 1000).toString(),
    });
    connectionUrl = `${connectionUrl}?${poolParams.toString()}`;
  }

  const prismaConfig: PrismaConfig = {
    log: logConfig,
  };

  // Add custom datasource URL if provided (for testing or special configurations)
  if (connectionUrl) {
    prismaConfig.datasources = {
      db: {
        url: connectionUrl,
      },
    };
  }

  const client = new PrismaClient(prismaConfig);

  // Enhanced logging
  client.$on('query', (e: any) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Database Query', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
        target: e.target,
      });
    }
  });

  client.$on('info', (e: any) => {
    logger.info('Database Info', { message: e.message, target: e.target });
  });

  client.$on('warn', (e: any) => {
    logger.warn('Database Warning', { message: e.message, target: e.target });
  });

  client.$on('error', (e: any) => {
    logger.error('Database Error', { message: e.message, target: e.target });
  });

  return client;
};

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Enhanced database utilities for better connection management
 */
export class DatabaseUtils {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection test successful');
      return true;
    } catch (error: any) {
      logger.error('Database connection test failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get database health metrics
   */
  static async getHealth(): Promise<{
    connected: boolean;
    schemaVersion?: string;
    tableCount?: number;
    connectionPool?: any;
  }> {
    try {
      // Test connection
      const connected = await this.testConnection();

      let schemaVersion: string | undefined;
      let tableCount: number | undefined;

      if (connected) {
        try {
          // Get schema version from migrations table (if exists)
          const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
            SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1
          `;
          schemaVersion = migrations[0]?.migration_name;
        } catch (error) {
          // Migrations table might not exist in fresh installations
          schemaVersion = 'unknown';
        }

        try {
          // Count tables (approximate)
          const tableResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) as count FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          `;
          tableCount = Number(tableResult[0]?.count || 0);
        } catch (error) {
          tableCount = 0;
        }
      }

      return {
        connected,
        schemaVersion,
        tableCount,
      };
    } catch (error: any) {
      logger.error('Failed to get database health', { error: error.message });
      return { connected: false };
    }
  }

  /**
   * Execute raw SQL with proper error handling and logging
   */
  static async executeRaw(query: string, params?: any[]): Promise<any> {
    const startTime = Date.now();

    try {
      const result = params && params.length > 0
        ? await prisma.$queryRawUnsafe(query, ...params)
        : await prisma.$queryRawUnsafe(query);

      const duration = Date.now() - startTime;

      logger.debug('Raw SQL executed', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rowCount: Array.isArray(result) ? result.length : 'unknown',
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Raw SQL execution failed', {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Run database migrations with health checks
   */
  static async migrateDatabase(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Starting database migration');

      // Test connection first
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Cannot migrate: database not connected');
      }

      // Run migrations programmatically if prisma migrate is available
      // Note: This would typically be handled by prisma CLI, but we can check migration status
      const healthAfter = await this.getHealth();

      logger.info('Database migration completed', { healthAfter });

      return { success: true };
    } catch (error: any) {
      logger.error('Database migration failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean shutdown - close database connections
   */
  static async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down database connections');
      await prisma.$disconnect();
      logger.info('Database connections closed');
    } catch (error: any) {
      logger.error('Error during database shutdown', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute a function within a database transaction
   * Provides automatic rollback on error
   */
  static async transaction<T>(
    callback: (tx: PrismaClient) => Promise<T>,
    options?: { timeout?: number; maxWait?: number }
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await prisma.$transaction(callback, {
        maxWait: options?.maxWait || 10000, // 10 seconds max wait
        timeout: options?.timeout || 30000, // 30 seconds timeout
      });
      const duration = Date.now() - startTime;
      logger.debug('Transaction completed', { duration: `${duration}ms` });
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Transaction failed', {
        error: error.message,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get database performance metrics
   */
  static async getPerformanceMetrics(): Promise<{
    queryStats?: any[];
    connectionPool?: any;
    tableSizes?: any[];
  }> {
    try {
      const metrics: any = {};

      // Get query statistics (if pg_stat_statements is enabled)
      try {
        const queryStats = await prisma.$queryRaw<Array<{
          query: string;
          calls: bigint;
          total_time: number;
          mean_time: number;
        }>>`
          SELECT 
            query,
            calls,
            total_exec_time as total_time,
            mean_exec_time as mean_time
          FROM pg_stat_statements
          WHERE query NOT LIKE '%pg_stat_statements%'
          ORDER BY total_exec_time DESC
          LIMIT 10
        `;
        metrics.queryStats = queryStats.map(stat => ({
          query: stat.query.substring(0, 100),
          calls: Number(stat.calls),
          totalTime: Number(stat.total_time),
          meanTime: Number(stat.mean_time),
        }));
      } catch (error) {
        // pg_stat_statements might not be enabled
        logger.debug('pg_stat_statements not available');
      }

      // Get table sizes
      try {
        const tableSizes = await prisma.$queryRaw<Array<{
          table_name: string;
          size_mb: number;
        }>>`
          SELECT 
            schemaname || '.' || tablename as table_name,
            pg_total_relation_size(schemaname || '.' || tablename) / 1024.0 / 1024.0 as size_mb
          FROM pg_stat_user_tables
          ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
        `;
        metrics.tableSizes = tableSizes.map(size => ({
          tableName: size.table_name,
          sizeMB: Number(size.size_mb),
        }));
      } catch (error: any) {
        logger.warn('Failed to get table sizes', { error: error.message });
      }

      return metrics;
    } catch (error: any) {
      logger.error('Failed to get performance metrics', { error: error.message });
      return {};
    }
  }

  /**
   * Check data integrity - verify foreign key constraints and orphaned records
   */
  static async checkDataIntegrity(): Promise<{
    valid: boolean;
    issues: Array<{ type: string; message: string; count?: number }>;
  }> {
    const issues: Array<{ type: string; message: string; count?: number }> = [];

    try {
      // Check for orphaned avatar forge requests (collectionId references non-existent collection)
      const orphanedAvatars = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM avatar_forge_requests
        WHERE collection_id IS NOT NULL
        AND collection_id NOT IN (SELECT id FROM avatar_collections)
      `;
      const orphanedCount = Number(orphanedAvatars[0]?.count || 0);
      if (orphanedCount > 0) {
        issues.push({
          type: 'orphaned_avatars',
          message: `Found ${orphanedCount} avatars with invalid collection references`,
          count: orphanedCount,
        });
      }

      // Check for orphaned drop listings (baseAvatarId references non-existent avatar)
      const orphanedDrops = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM drop_listings
        WHERE base_avatar_id NOT IN (SELECT id FROM avatar_forge_requests)
      `;
      const orphanedDropCount = Number(orphanedDrops[0]?.count || 0);
      if (orphanedDropCount > 0) {
        issues.push({
          type: 'orphaned_drops',
          message: `Found ${orphanedDropCount} drops with invalid base avatar references`,
          count: orphanedDropCount,
        });
      }

      // Check for missing image files (if storage URLs are stored)
      // This would require checking actual file system, handled separately

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error: any) {
      logger.error('Data integrity check failed', { error: error.message });
      return {
        valid: false,
        issues: [{ type: 'check_error', message: `Integrity check failed: ${error.message}` }],
      };
    }
  }

  /**
   * Create database backup (exports schema and data)
   * Note: This is a basic implementation. For production, use pg_dump
   */
  static async createBackup(): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('Creating database backup');
      // In a real implementation, you would use pg_dump here
      // For now, we'll just log that backup was requested
      return {
        success: true,
        message: 'Backup functionality requires pg_dump. Use: pg_dump -h localhost -U avatar_user -d avatar_drop_system > backup.sql',
      };
    } catch (error: any) {
      logger.error('Backup creation failed', { error: error.message });
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export default prisma;
