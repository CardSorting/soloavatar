import { NextRequest, NextResponse } from 'next/server';
import { AvatarService } from '@/lib/server/domains/gemini/services/avatarService';
import { BadRequestError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';
import { queueService } from '@/lib/server/infrastructure/queue/queueService';
import { prisma } from '@/lib/server/infrastructure/database/prisma';
import { StorageService } from '@/lib/server/infrastructure/storage/storageService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, stylePrompt, userId } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!stylePrompt) {
      return NextResponse.json(
        { error: 'Style prompt is required' },
        { status: 400 }
      );
    }

    // For simplicity, userId can be provided or default to 'anonymous'
    const finalUserId = userId || 'anonymous';

    // Ensure queue service is initialized
    if (!queueService.isInitialized()) {
      await queueService.initialize();
    }

    // Upload input image to storage first
    logger.info('Uploading input image', { userId: finalUserId });
    const inputUpload = await StorageService.uploadImageFromDataUrl(imageBase64, {
      userId: finalUserId,
      avatarForgeType: 'input',
    });

    // Create request record in database with pending status
    const request = await prisma.avatarForgeRequest.create({
      data: {
        userId: finalUserId,
        stylePrompt,
        inputImageUrl: inputUpload.url,
        inputImageFileId: inputUpload.fileId,
        outputImageUrl: null,
        status: 'pending',
      },
    });

    // Enqueue the avatar generation job
    const jobId = await queueService.enqueueAvatarGeneration({
      requestId: request.id,
      imageBase64,
      stylePrompt,
      userId: finalUserId,
      inputImageUrl: inputUpload.url,
      inputImageFileId: inputUpload.fileId,
    });

    logger.info('Avatar generation queued', {
      requestId: request.id,
    });

    // Return immediately with the request ID
    return NextResponse.json({
      success: true,
      requestId: request.id,
      jobId,
      status: 'pending',
      message: 'Avatar generation started. Check status using the request ID.',
    });
  } catch (error: any) {
    logger.error('Avatar generation API error', { error: error.message });
    
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to queue avatar generation' },
      { status: 500 }
    );
  }
}

