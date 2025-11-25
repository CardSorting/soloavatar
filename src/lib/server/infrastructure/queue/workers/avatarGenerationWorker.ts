/**
 * Avatar Generation Worker
 * Processes avatar generation jobs from the queue
 */

import { QueueName, queueService, AvatarGenerationJobData } from '../queueService';
import { GeminiService } from '../../../domains/gemini/services/geminiService';
import { StorageService } from '../../storage/storageService';
import { prisma } from '../../database/prisma';
import logger from '../../../shared/utils/logger';

/**
 * Process an avatar generation job
 */
export async function processAvatarGenerationJob(
  job: { id: string; data: AvatarGenerationJobData }
): Promise<void> {
  const { id: jobId, data } = job;
  const { requestId, imageBase64, stylePrompt, userId, inputImageUrl, inputImageFileId } = data;

  logger.info('Starting avatar generation', {
    requestId,
    stylePrompt: stylePrompt.substring(0, 50) + (stylePrompt.length > 50 ? '...' : ''),
  });

  const startTime = Date.now();
  let outputImageUrl: string | undefined;
  let outputImageFileId: string | undefined;

  try {
    // Update request status to processing
    await prisma.avatarForgeRequest.update({
      where: { id: requestId },
      data: {
        status: 'processing',
      },
    });

    // Construct the avatar generation prompt
    const avatarPrompt = `Generate a high-quality profile picture/avatar based on this input image. 
Transform the subject into the following style: ${stylePrompt}. 
Keep the main facial features recognizable but heavily apply the artistic style. 
Ensure the composition is centered and suitable for a social media profile picture.
The output should be a professional, high-resolution avatar that maintains the person's identity while fully embracing the artistic style.`;

    logger.info('Generating avatar with style', {
      requestId,
      stylePromptLength: stylePrompt.length,
    });

    // Use Gemini service to generate the image
    const generatedImageDataUrl = await GeminiService.generateEditedImage({
      baseImageBase64: imageBase64,
      overlayImageBase64: null,
      prompt: avatarPrompt,
    });

    // Upload generated image to storage
    logger.info('Uploading generated avatar', { requestId });
    const outputUpload = await StorageService.uploadImageFromDataUrl(generatedImageDataUrl, {
      userId,
      avatarForgeType: 'output',
    });
    outputImageUrl = outputUpload.url;
    outputImageFileId = outputUpload.fileId;

    const duration = Date.now() - startTime;

    // Update request record with output
    await prisma.avatarForgeRequest.update({
      where: { id: requestId },
      data: {
        outputImageUrl,
        outputImageFileId,
        status: 'completed',
        processingTimeMs: duration,
      },
    });

    logger.info('Avatar generated successfully', {
      requestId,
      duration: `${duration}ms`,
      outputImageUrl,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error('Avatar generation job failed', {
      jobId,
      requestId,
      error: error.message,
      duration: `${duration}ms`,
    });

    // Update request status to failed
    try {
      await prisma.avatarForgeRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
          processingTimeMs: duration,
        },
      });
    } catch (updateError: any) {
      logger.error('Failed to update avatar request status', {
        requestId,
        error: updateError.message,
      });
    }

    // Re-throw to mark job as failed in pg-boss
    throw error;
  }
}

/**
 * Start the avatar generation worker
 */
export async function startAvatarGenerationWorker(): Promise<void> {
  const boss = queueService.getBoss();

  await boss.work(QueueName.AVATAR_GENERATION, {
    teamSize: 1,
    teamConcurrency: 1,
  }, async (job: { id: string; data: AvatarGenerationJobData } | null) => {
    if (!job) {
      return;
    }

    try {
      await processAvatarGenerationJob({
        id: job.id,
        data: job.data,
      });
    } catch (error: any) {
      logger.error('Error processing avatar generation job', {
        jobId: job.id,
        error: error.message,
      });
      throw error; // Let pg-boss handle retries
    }
  });

  logger.info('Avatar generation worker started');
}

