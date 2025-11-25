import { NextRequest, NextResponse } from 'next/server';
import { AvatarService } from '@/lib/server/domains/gemini/services/avatarService';
import { queueService } from '@/lib/server/infrastructure/queue/queueService';
import { prisma } from '@/lib/server/infrastructure/database/prisma';
import { StorageService } from '@/lib/server/infrastructure/storage/storageService';
import { BadRequestError, NotFoundError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

interface RegenerateRequestBody {
  stylePrompt?: string;
  userId?: string;
}

/**
 * POST /api/avatars/[id]/regenerate
 * Regenerate an avatar with a new or updated style
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as RegenerateRequestBody;
    const { stylePrompt, userId } = body;

    // Get existing avatar
    const existingAvatar = await prisma.avatarForgeRequest.findUnique({
      where: { id: params.id },
    });

    if (!existingAvatar || existingAvatar.deletedAt) {
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      );
    }

    if (!existingAvatar.inputImageUrl) {
      return NextResponse.json(
        { error: 'Original input image not found' },
        { status: 400 }
      );
    }

    // Use provided style prompt or existing one
    const finalStylePrompt = stylePrompt || existingAvatar.stylePrompt;

    if (!finalStylePrompt) {
      return NextResponse.json(
        { error: 'Style prompt is required' },
        { status: 400 }
      );
    }

    // Single user system - use default user ID
    const finalUserId: string = userId || 'single-user';

    // Ensure queue service is initialized
    if (!queueService.isInitialized()) {
      await queueService.initialize();
    }

    // Get input image (we need base64, so fetch from URL if needed)
    // For now, we'll use the input image URL directly
    // In production, you might want to store base64 or fetch it
    let imageBase64: string;
    
    try {
      // Try to fetch the input image
      const imageResponse = await fetch(existingAvatar.inputImageUrl);
      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(imageBuffer).toString('base64');
        // Add data URL prefix if not present
        if (!imageBase64.startsWith('data:')) {
          imageBase64 = `data:image/jpeg;base64,${imageBase64}`;
        }
      } else {
        // Fallback: try to use input image URL directly
        imageBase64 = existingAvatar.inputImageUrl;
      }
    } catch (fetchError: any) {
      logger.warn('Failed to fetch input image, using URL directly', {
        error: fetchError.message,
      });
      imageBase64 = existingAvatar.inputImageUrl;
    }

    // Create new request record for regeneration
    const newRequest = await prisma.avatarForgeRequest.create({
      data: {
        stylePrompt: finalStylePrompt,
        inputImageUrl: existingAvatar.inputImageUrl,
        inputImageFileId: existingAvatar.inputImageFileId,
        outputImageUrl: null,
        status: 'pending',
      },
    });

    // Enqueue the regeneration job
    const jobId = await queueService.enqueueAvatarGeneration({
      requestId: newRequest.id,
      imageBase64,
      stylePrompt: finalStylePrompt,
      userId: finalUserId,
      inputImageUrl: existingAvatar.inputImageUrl,
      inputImageFileId: existingAvatar.inputImageFileId,
    });

    logger.info('Avatar regeneration queued', {
      originalId: params.id,
      newRequestId: newRequest.id,
    });

    return NextResponse.json({
      success: true,
      originalId: params.id,
      newRequestId: newRequest.id,
      jobId,
      status: 'pending',
      message: 'Avatar regeneration started. Check status using the new request ID.',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Regenerate avatar API error', { error: error.message });
    
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof NotFoundError ? 404 : 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to queue avatar regeneration' },
      { status: 500 }
    );
  }
}

