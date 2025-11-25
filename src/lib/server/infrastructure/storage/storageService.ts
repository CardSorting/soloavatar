/**
 * Simplified storage service
 * For production, replace with cloud storage (S3, Backblaze, etc.)
 */

import logger from '../../shared/utils/logger';
import { BadRequestError, InternalServerError } from '../../shared/errors';
import { config } from '../config';

interface UploadOptions {
  userId?: string;
  avatarForgeType?: 'input' | 'output';
}

interface UploadResult {
  url: string;
  fileId: string;
  fileName: string;
}

export class StorageService {
  /**
   * Upload image from data URL
   * For simplicity, this stores the data URL directly
   * In production, you'd upload to cloud storage
   */
  static async uploadImageFromDataUrl(
    dataUrl: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      // Validate data URL format
      const match = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
      if (!match) {
        throw new BadRequestError('Image must be a valid base64 data URL');
      }

      const mimeType = match[1];
      const base64Data = match[2];

      // Generate file ID and name
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const extension = this.getExtensionFromMimeType(mimeType);
      const fileName = this.buildFileName(extension, options);

      // For local storage, we can store the data URL directly
      // In production, you'd upload to cloud storage and get a URL
      const url = config.storage.type === 'cloud'
        ? `${config.storage.baseUrl}/storage/${fileName}`
        : dataUrl; // For local, return data URL directly

      logger.info('Image uploaded', {
        fileId,
        fileName,
        storageType: config.storage.type,
      });

      return {
        url,
        fileId,
        fileName,
      };
    } catch (error: any) {
      logger.error('Storage upload failed', { error: error.message });
      throw new InternalServerError('Failed to upload image');
    }
  }

  private static getExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
      case 'image/png':
        return 'png';
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/gif':
        return 'gif';
      case 'image/webp':
        return 'webp';
      default:
        return 'png';
    }
  }

  private static buildFileName(extension: string, options?: UploadOptions): string {
    const parts: string[] = [];
    
    if (options?.avatarForgeType) {
      parts.push('avatar-forge');
      if (options?.userId) {
        parts.push(`user-${options.userId}`);
      }
      parts.push(options.avatarForgeType);
    } else {
      parts.push('uploads');
      if (options?.userId) {
        parts.push(`user-${options.userId}`);
      }
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    return `${parts.join('/')}/${timestamp}-${randomId}.${extension}`;
  }
}

