import { NextRequest, NextResponse } from 'next/server';
import { queueService } from '@/lib/server/infrastructure/queue/queueService';
import { prisma } from '@/lib/server/infrastructure/database/prisma';
import { StorageService } from '@/lib/server/infrastructure/storage/storageService';
import { BadRequestError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

interface BatchGenerateRequestBody {
  imageBase64: string;
  stylePrompts: string[]; // Array of style prompts
  userId?: string;
}

/**
 * POST /api/avatars/batch-generate
 * Generate multiple avatars from one image with different styles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BatchGenerateRequestBody;
    const { imageBase64, stylePrompts, userId } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!stylePrompts || !Array.isArray(stylePrompts) || stylePrompts.length === 0) {
      return NextResponse.json(
        { error: 'stylePrompts array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (stylePrompts.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 styles allowed per batch' },
        { status: 400 }
      );
    }

    // Single user system - use default user ID
    const finalUserId: string = userId || 'single-user';

    // Ensure queue service is initialized
    if (!queueService.isInitialized()) {
      await queueService.initialize();
    }

    // Upload input image once
    logger.info('Uploading input image for batch generation', { userId: finalUserId });
    const inputUpload = await StorageService.uploadImageFromDataUrl(imageBase64, {
      userId: finalUserId,
      avatarForgeType: 'input',
    });

    // Create request records and enqueue jobs
    const requests = [];
    const jobIds = [];

    for (const stylePrompt of stylePrompts) {
      // Create request record
      const avatarRequest = await prisma.avatarForgeRequest.create({
        data: {
          stylePrompt,
          inputImageUrl: inputUpload.url,
          inputImageFileId: inputUpload.fileId,
          outputImageUrl: null,
          status: 'pending',
        },
      });

      // Enqueue the avatar generation job
      const jobId = await queueService.enqueueAvatarGeneration({
        requestId: avatarRequest.id,
        imageBase64,
        stylePrompt,
        userId: finalUserId,
        inputImageUrl: inputUpload.url,
        inputImageFileId: inputUpload.fileId,
      });

      requests.push({
        id: avatarRequest.id,
        stylePrompt,
        status: 'pending',
      });
      jobIds.push(jobId);
    }

    logger.info('Batch avatar generation queued', {
      count: requests.length,
      requestIds: requests.map(r => r.id),
    });

    return NextResponse.json({
      success: true,
      requests,
      jobIds,
      message: `Batch generation started for ${requests.length} avatars. Check status using the request IDs.`,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Batch avatar generation API error', { error: error.message });
    
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to queue batch avatar generation' },
      { status: 500 }
    );
  }
}

