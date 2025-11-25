/**
 * Health Check API Endpoint
 * Provides health status and metrics for monitoring
 */

import { NextResponse } from 'next/server';
import { HealthService } from '../../../lib/server/infrastructure/monitoring/healthService';
import logger from '../../../lib/server/shared/utils/logger';

/**
 * GET /api/health
 * Get comprehensive health status
 */
export async function GET() {
  try {
    const health = await HealthService.getHealthStatus();
    
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

