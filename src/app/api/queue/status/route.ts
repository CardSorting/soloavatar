/**
 * Queue Status API
 * Simple endpoint to check queue health and status
 */

import { NextRequest, NextResponse } from 'next/server';
import { queueService } from '@/lib/server/infrastructure/queue/queueService';
import logger from '@/lib/server/shared/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Ensure queue is initialized
    if (!queueService.isInitialized()) {
      try {
        await queueService.initialize();
      } catch (error: any) {
        return NextResponse.json({
          initialized: false,
          error: 'Queue service not available',
          message: error.message,
        }, { status: 503 });
      }
    }

    const status = await queueService.getQueueStatus();

    return NextResponse.json({
      ...status,
      message: status.initialized 
        ? 'Queue is running' 
        : 'Queue is not initialized',
    });
  } catch (error: any) {
    logger.error('Failed to get queue status', { error: error.message });
    
    return NextResponse.json(
      { 
        initialized: false,
        error: 'Failed to get queue status',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

