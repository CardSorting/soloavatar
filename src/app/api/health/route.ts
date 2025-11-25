/**
 * Health Check API Endpoint
 * Provides health status and metrics for monitoring
 */

import { NextResponse } from 'next/server';
import { HealthService } from '../../../lib/server/infrastructure/monitoring/healthService';
import { queueService } from '../../../lib/server/infrastructure/queue/queueService';
import logger from '../../../lib/server/shared/utils/logger';

/**
 * GET /api/health
 * Get comprehensive health status including queue status
 */
export async function GET() {
  try {
    const health = await HealthService.getHealthStatus();
    
    // Add queue status if available
    try {
      if (queueService.isInitialized()) {
        const queueStatus = await queueService.getQueueStatus();
        health.components = health.components || {};
        health.components.queue = {
          status: queueStatus.initialized ? 'healthy' : 'unhealthy',
          message: queueStatus.initialized 
            ? `Queue running (${queueStatus.queues.avatar_generation.pending + queueStatus.queues.drop_generation.pending} pending jobs)`
            : 'Queue not initialized',
          details: queueStatus,
        };
      } else {
        health.components = health.components || {};
        health.components.queue = {
          status: 'degraded',
          message: 'Queue not initialized',
        };
      }
    } catch (queueError: any) {
      logger.warn('Failed to get queue status in health check', { error: queueError.message });
      health.components = health.components || {};
      health.components.queue = {
        status: 'unknown',
        message: 'Queue status unavailable',
      };
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}

