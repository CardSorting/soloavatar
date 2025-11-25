/**
 * Worker Startup API
 * Starts queue workers (can be called on server startup or manually)
 */

import { NextRequest, NextResponse } from 'next/server';
import { startWorkers } from '@/lib/server/infrastructure/queue/workerManager';
import logger from '@/lib/server/shared/utils/logger';

export async function POST(request: NextRequest) {
  try {
    await startWorkers();
    
    return NextResponse.json({
      success: true,
      message: 'Workers started successfully',
    });
  } catch (error: any) {
    logger.error('Failed to start workers', { error: error.message });
    
    return NextResponse.json(
      { error: 'Failed to start workers', details: error.message },
      { status: 500 }
    );
  }
}

