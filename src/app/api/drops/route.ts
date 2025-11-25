import { NextRequest, NextResponse } from 'next/server';
import { DropService } from '@/lib/server/domains/drops/services/dropService';
import { BadRequestError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';
import { queueService } from '@/lib/server/infrastructure/queue/queueService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseAvatarId, title, description, stockLimit, collectionName, traitConfig, userId } = body;

    if (!baseAvatarId || !title || !stockLimit) {
      return NextResponse.json(
        { error: 'baseAvatarId, title, and stockLimit are required' },
        { status: 400 }
      );
    }

    // For simplicity, userId can be provided or default to 'anonymous'
    const finalUserId = userId || 'anonymous';

    // Create the drop
    const drop = await DropService.createDrop({
      baseAvatarId,
      title,
      description,
      stockLimit: parseInt(stockLimit),
      collectionName,
      traitConfig,
    });

    // Ensure queue service is initialized
    if (!queueService.isInitialized()) {
      await queueService.initialize();
    }

    // Enqueue drop generation job to generate variations
    const jobId = await queueService.enqueueDropGeneration({
      dropId: drop.id,
      baseAvatarId,
      stockLimit: parseInt(stockLimit),
      traitConfig,
    });

    logger.info('Drop generation job enqueued', {
      dropId: drop.id,
      jobId,
    });

    return NextResponse.json({
      success: true,
      drop,
      jobId,
      message: 'Drop created and generation queued successfully',
    });
  } catch (error: any) {
    logger.error('Create drop API error', { error: error.message });
    
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create drop' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let drops;
    if (userId) {
      // Get user's personal drops
      drops = await DropService.getUserDrops(userId);
    } else {
      // Get all drops
      drops = await DropService.getAllDrops(limit);
    }

    return NextResponse.json(drops);
  } catch (error: any) {
    logger.error('Get drops API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get drops' },
      { status: 500 }
    );
  }
}

