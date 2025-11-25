import { GeminiService } from './geminiService';
import logger from '../../../shared/utils/logger';
import { BadRequestError, InternalServerError } from '../../../shared/errors';
import { StorageService } from '../../../infrastructure/storage/storageService';
import { prisma } from '../../../infrastructure/database/prisma';

/**
 * Avatar generation service
 * Handles avatar generation using Gemini AI
 */
export class AvatarService {
  /**
   * Generate an avatar based on an input image and a specific style
   */
  static async generateAvatar(
    imageBase64: string,
    stylePrompt: string,
    userId: string
  ): Promise<string> {
    const startTime = Date.now();
    let requestId: string | undefined;
    let inputImageUrl: string | undefined;
    let inputImageFileId: string | undefined;
    
    try {
      // Validate inputs
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        throw new BadRequestError('Image is required and must be a string');
      }

      if (!stylePrompt || typeof stylePrompt !== 'string') {
        throw new BadRequestError('Style prompt is required and must be a string');
      }

      // Upload input image to storage
      logger.info('Uploading input image', { userId });

      const inputUpload = await StorageService.uploadImageFromDataUrl(imageBase64, {
        userId,
        avatarForgeType: 'input',
      });
      inputImageUrl = inputUpload.url;
      inputImageFileId = inputUpload.fileId;

      // Create request record in database
      // Note: userId field removed from schema for single-user system
      try {
        const avatarRequest = await prisma.avatarForgeRequest.create({
          data: {
            stylePrompt,
            inputImageUrl,
            inputImageFileId,
            outputImageUrl: null,
            status: 'processing',
          },
        });
        requestId = avatarRequest.id;
        logger.info('Avatar forge request created', { requestId, userId });
      } catch (dbError: any) {
        logger.warn('Failed to create avatar forge request record', {
          error: dbError.message,
          userId,
        });
        // Continue with generation even if DB save fails
      }

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
      const outputImageUrl = outputUpload.url;
      const outputImageFileId = outputUpload.fileId;

      const duration = Date.now() - startTime;

      // Update request record with output
      if (requestId) {
        try {
          await prisma.avatarForgeRequest.update({
            where: { id: requestId },
            data: {
              outputImageUrl,
              outputImageFileId,
              status: 'completed',
              processingTimeMs: duration,
            },
          });
          logger.info('Avatar forge request updated', { requestId });
        } catch (dbError: any) {
          logger.warn('Failed to update avatar forge request', {
            error: dbError.message,
            requestId,
          });
        }
      }
      
      logger.info('Avatar generated successfully', {
        requestId,
        duration: `${duration}ms`,
        outputImageUrl,
      });

      return outputImageUrl;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Update request record with error (if created)
      if (requestId) {
        try {
          await prisma.avatarForgeRequest.update({
            where: { id: requestId },
            data: {
              status: 'failed',
              errorMessage: error.message || 'Unknown error',
              processingTimeMs: duration,
            },
          });
        } catch (dbError: any) {
          logger.warn('Failed to update avatar forge request with error', {
            error: dbError.message,
            requestId,
          });
        }
      }
      
      logger.error('Avatar generation failed', {
        requestId,
        error: error.message,
        duration: `${duration}ms`,
      });

      throw error;
    }
  }

  /**
   * Get avatar by ID
   */
  static async getAvatarById(avatarId: string): Promise<any> {
    const avatar = await prisma.avatarForgeRequest.findUnique({
      where: { id: avatarId },
    });

    if (!avatar) {
      throw new BadRequestError('Avatar not found');
    }

    return avatar;
  }

  /**
   * Get user's avatars
   * Note: In single-user system, returns all avatars (userId parameter kept for API compatibility)
   */
  static async getUserAvatars(userId: string): Promise<any[]> {
    return prisma.avatarForgeRequest.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

