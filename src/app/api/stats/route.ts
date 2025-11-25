import { NextRequest, NextResponse } from 'next/server';
import { CollectionStatsService } from '@/lib/server/domains/collections/services/collectionStatsService';
import logger from '@/lib/server/shared/utils/logger';

/**
 * GET /api/stats
 * Get collection statistics
 * 
 * Query params:
 * - quick: 'true' for lightweight stats only (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quick = searchParams.get('quick') === 'true';

    if (quick) {
      const stats = await CollectionStatsService.getQuickStats();
      return NextResponse.json({
        ...stats,
        timestamp: new Date().toISOString(),
      });
    }

    const stats = await CollectionStatsService.calculateStatistics();
    
    return NextResponse.json({
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Get stats API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}

