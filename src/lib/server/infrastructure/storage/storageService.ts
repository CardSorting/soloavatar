/**
 * Enhanced Local File Storage Service
 * Optimized for local development and production self-hosting
 */

import { promises as fs } from 'fs';
import path from 'path';
import { BadRequestError, InternalServerError } from '../../shared/errors';
import logger from '../../shared/utils/logger';
import { config } from '../config';
import { ImageOptimizer, ImageMetadata } from './imageOptimizer';

interface UploadOptions {
  userId?: string;
  avatarForgeType?: 'input' | 'output';
  dropType?: 'base' | 'variation';
}

interface UploadResult {
  url: string;
  fileId: string;
  fileName: string;
  filePath: string; // Internal file path for local storage
  sizeInBytes: number;
  thumbnailUrl?: string; // URL for thumbnail if generated
  thumbnailPath?: string; // Path to thumbnail file
  metadata?: ImageMetadata; // Image metadata
  optimized?: boolean; // Whether image was optimized
}

interface StorageStats {
  totalFiles: number;
  totalSizeBytes: number;
  usedStorageGB: number;
}

export class StorageService {
  // Local storage directory (relative to project root)
  public static readonly STORAGE_BASE_DIR = 'data/storage';

  // URL path prefix for serving files
  private static readonly URL_PATH_PREFIX = '/api/storage';

  // Maximum file sizes (in bytes)
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MAX_TOTAL_STORAGE = 5 * 1024 * 1024 * 1024; // 5GB

  // Image optimization settings
  private static readonly ENABLE_AUTO_OPTIMIZATION = process.env.STORAGE_AUTO_OPTIMIZE !== 'false';
  private static readonly ENABLE_THUMBNAILS = process.env.STORAGE_GENERATE_THUMBNAILS !== 'false';
  private static readonly THUMBNAIL_WIDTH = 300;
  private static readonly THUMBNAIL_HEIGHT = 300;

  /**
   * Initialize storage directory structure
   */
  static async initialize(): Promise<void> {
    try {
      // Create main storage directory
      await fs.mkdir(this.STORAGE_BASE_DIR, { recursive: true });

      // Create subdirectories for organization
      const dirs = [
        'avatars/input',
        'avatars/output',
        'avatars/thumbnails',
        'drops/base',
        'drops/variations',
        'drops/thumbnails',
        'temp',
      ];

      for (const dir of dirs) {
        await fs.mkdir(path.join(this.STORAGE_BASE_DIR, dir), { recursive: true });
      }

      logger.info('Storage directories initialized');
    } catch (error: any) {
      logger.error('Failed to initialize storage directories', { error: error.message });
      throw new InternalServerError('Failed to initialize storage system');
    }
  }

  /**
   * Upload image from data URL to local filesystem
   */
  static async uploadImageFromDataUrl(
    dataUrl: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validate data URL format
      const match = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
      if (!match) {
        throw new BadRequestError('Image must be a valid base64 data URL');
      }

      const mimeType = match[1];
      const base64Data = match[2];

      // Decode base64 and validate file size
      const imageBuffer = Buffer.from(base64Data, 'base64');
      if (imageBuffer.length > this.MAX_FILE_SIZE) {
        throw new BadRequestError(`File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Check total storage usage
      const stats = await this.getStorageStats();
      if (stats.totalSizeBytes + imageBuffer.length > this.MAX_TOTAL_STORAGE) {
        throw new BadRequestError('Storage limit exceeded. Please delete some files or increase storage capacity.');
      }

      // Generate unique file ID and path
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const extension = this.getExtensionFromMimeType(mimeType);
      const relativePath = this.buildRelativePath(extension, options);
      const fullPath = path.join(this.STORAGE_BASE_DIR, relativePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file to disk
      await fs.writeFile(fullPath, imageBuffer);

      // Optimize and generate thumbnail if enabled
      let optimized = false;
      let thumbnailUrl: string | undefined;
      let thumbnailPath: string | undefined;
      let metadata: ImageMetadata | undefined;

      try {
        // Validate it's an image
        const isValidImage = await ImageOptimizer.validateImage(fullPath);
        
        if (isValidImage) {
          // Get metadata
          metadata = await ImageOptimizer.getMetadata(fullPath);

          // Optimize image if enabled
          if (this.ENABLE_AUTO_OPTIMIZATION) {
            try {
              const optimalFormat = await ImageOptimizer.getOptimalFormat(fullPath);
              await ImageOptimizer.optimizeInPlace(fullPath, {
                quality: 85,
                maxWidth: 2048, // Max width for storage efficiency
                maxHeight: 2048,
                format: optimalFormat,
              });
              optimized = true;
              // Update size after optimization
              metadata = await ImageOptimizer.getMetadata(fullPath);
            } catch (optError: any) {
              logger.warn('Image optimization failed, using original', {
                filePath: fullPath,
                error: optError.message,
              });
            }
          }

          // Generate thumbnail if enabled
          if (this.ENABLE_THUMBNAILS) {
            try {
              const thumbnailRelativePath = this.buildThumbnailPath(relativePath);
              const thumbnailFullPath = path.join(this.STORAGE_BASE_DIR, thumbnailRelativePath);
              
              await ImageOptimizer.generateThumbnail(fullPath, thumbnailFullPath, {
                width: this.THUMBNAIL_WIDTH,
                height: this.THUMBNAIL_HEIGHT,
                quality: 80,
                format: 'jpeg',
              });

              thumbnailPath = thumbnailFullPath;
              thumbnailUrl = this.buildUrl(thumbnailRelativePath);
            } catch (thumbError: any) {
              logger.warn('Thumbnail generation failed', {
                filePath: fullPath,
                error: thumbError.message,
              });
            }
          }
        }
      } catch (imageError: any) {
        logger.warn('Image processing failed', {
          filePath: fullPath,
          error: imageError.message,
        });
        // Continue even if optimization fails
      }

      // Generate URL for accessing the file
      const url = this.buildUrl(relativePath);
      const fileName = path.basename(relativePath);

      // Get final file size
      const finalStats = await fs.stat(fullPath);
      const finalSize = finalStats.size;

      logger.info('Image uploaded to local storage', {
        fileId,
        fileName,
        fullPath,
        sizeInBytes: finalSize,
        originalSize: imageBuffer.length,
        optimized,
        hasThumbnail: !!thumbnailUrl,
        mimeType,
      });

      return {
        url,
        fileId,
        fileName,
        filePath: fullPath,
        sizeInBytes: finalSize,
        thumbnailUrl,
        thumbnailPath,
        metadata,
        optimized,
      };
    } catch (error: any) {
      logger.error('Storage upload failed', { error: error.message });
      throw new InternalServerError('Failed to upload image');
    }
  }

  /**
   * Upload image from file buffer (for direct file uploads)
   */
  static async uploadImageFromBuffer(
    buffer: Buffer,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      if (buffer.length > this.MAX_FILE_SIZE) {
        throw new BadRequestError(`File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      const stats = await this.getStorageStats();
      if (stats.totalSizeBytes + buffer.length > this.MAX_TOTAL_STORAGE) {
        throw new BadRequestError('Storage limit exceeded. Please delete some files or increase storage capacity.');
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const extension = this.getExtensionFromMimeType(mimeType);
      const relativePath = this.buildRelativePath(extension, options);
      const fullPath = path.join(this.STORAGE_BASE_DIR, relativePath);

      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, buffer);

      // Optimize and generate thumbnail (same as data URL upload)
      let optimized = false;
      let thumbnailUrl: string | undefined;
      let thumbnailPath: string | undefined;
      let metadata: ImageMetadata | undefined;

      try {
        const isValidImage = await ImageOptimizer.validateImage(fullPath);
        
        if (isValidImage) {
          metadata = await ImageOptimizer.getMetadata(fullPath);

          if (this.ENABLE_AUTO_OPTIMIZATION) {
            try {
              const optimalFormat = await ImageOptimizer.getOptimalFormat(fullPath);
              await ImageOptimizer.optimizeInPlace(fullPath, {
                quality: 85,
                maxWidth: 2048,
                maxHeight: 2048,
                format: optimalFormat,
              });
              optimized = true;
              metadata = await ImageOptimizer.getMetadata(fullPath);
            } catch (optError: any) {
              logger.warn('Image optimization failed', { filePath: fullPath, error: optError.message });
            }
          }

          if (this.ENABLE_THUMBNAILS) {
            try {
              const thumbnailRelativePath = this.buildThumbnailPath(relativePath);
              const thumbnailFullPath = path.join(this.STORAGE_BASE_DIR, thumbnailRelativePath);
              
              await ImageOptimizer.generateThumbnail(fullPath, thumbnailFullPath, {
                width: this.THUMBNAIL_WIDTH,
                height: this.THUMBNAIL_HEIGHT,
                quality: 80,
                format: 'jpeg',
              });

              thumbnailPath = thumbnailFullPath;
              thumbnailUrl = this.buildUrl(thumbnailRelativePath);
            } catch (thumbError: any) {
              logger.warn('Thumbnail generation failed', { filePath: fullPath, error: thumbError.message });
            }
          }
        }
      } catch (imageError: any) {
        logger.warn('Image processing failed', { filePath: fullPath, error: imageError.message });
      }

      const url = this.buildUrl(relativePath);
      const fileName = path.basename(relativePath);
      const finalStats = await fs.stat(fullPath);
      const finalSize = finalStats.size;

      logger.info('Image buffer uploaded', {
        fileId,
        fileName,
        fullPath,
        sizeInBytes: finalSize,
        optimized,
        hasThumbnail: !!thumbnailUrl,
      });

      return {
        url,
        fileId,
        fileName,
        filePath: fullPath,
        sizeInBytes: finalSize,
        thumbnailUrl,
        thumbnailPath,
        metadata,
        optimized,
      };
    } catch (error: any) {
      logger.error('Buffer upload failed', { error: error.message });
      throw new InternalServerError('Failed to upload image');
    }
  }

  /**
   * Read file as buffer
   */
  static async readFileAsBuffer(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error: any) {
      logger.error('Failed to read file', { filePath, error: error.message });
      throw new InternalServerError('Failed to read file');
    }
  }

  /**
   * Delete file and associated thumbnail if exists
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info('File deleted', { filePath });

      // Try to delete associated thumbnail
      try {
        const relativePath = path.relative(this.STORAGE_BASE_DIR, filePath);
        const thumbnailRelativePath = this.buildThumbnailPath(relativePath);
        const thumbnailPath = path.join(this.STORAGE_BASE_DIR, thumbnailRelativePath);
        await fs.unlink(thumbnailPath);
        logger.debug('Thumbnail deleted', { thumbnailPath });
      } catch (thumbError: any) {
        // Thumbnail might not exist, ignore
        if (thumbError.code !== 'ENOENT') {
          logger.warn('Failed to delete thumbnail', { error: thumbError.message });
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error('Failed to delete file', { filePath, error: error.message });
        throw new InternalServerError('Failed to delete file');
      }
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<StorageStats> {
    try {
      let totalFiles = 0;
      let totalSizeBytes = 0;

      const walkDir = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            try {
              const stats = await fs.stat(fullPath);
              totalFiles++;
              totalSizeBytes += stats.size;
            } catch (error) {
              // Skip files that can't be accessed
            }
          }
        }
      };

      await walkDir(this.STORAGE_BASE_DIR);

      return {
        totalFiles,
        totalSizeBytes,
        usedStorageGB: totalSizeBytes / (1024 * 1024 * 1024),
      };
    } catch (error: any) {
      logger.error('Failed to get storage stats', { error: error.message });
      return { totalFiles: 0, totalSizeBytes: 0, usedStorageGB: 0 };
    }
  }

  /**
   * Clean up orphaned files and temp files
   */
  static async cleanup(options: { dryRun?: boolean; olderThanDays?: number } = {}): Promise<{ deleted: string[]; errors: string[] }> {
    const deleted: string[] = [];
    const errors: string[] = [];
    const cutoffTime = options.olderThanDays ? Date.now() - (options.olderThanDays * 24 * 60 * 60 * 1000) : 0;

    try {
      // Clean temp directory
      const tempDir = path.join(this.STORAGE_BASE_DIR, 'temp');
      const tempFiles = await fs.readdir(tempDir).catch(() => []);

      for (const file of tempFiles) {
        const filePath = path.join(tempDir, file);
        try {
          if (!options.dryRun) {
            await fs.unlink(filePath);
          }
          deleted.push(filePath);
        } catch (error: any) {
          errors.push(`${filePath}: ${error.message}`);
        }
      }

      logger.info('Storage cleanup completed', {
        deletedCount: deleted.length,
        errorsCount: errors.length,
        dryRun: options.dryRun || false,
      });
    } catch (error: any) {
      logger.error('Cleanup failed', { error: error.message });
    }

    return { deleted, errors };
  }

  /**
   * Convert file path to URL
   */
  static buildUrl(relativePath: string): string {
    return `${config.storage.baseUrl}${this.URL_PATH_PREFIX}/${relativePath}`;
  }

  /**
   * Convert URL back to file path
   */
  static urlToFilePath(url: string): string | null {
    const prefix = `${config.storage.baseUrl}${this.URL_PATH_PREFIX}/`;
    if (!url.startsWith(prefix)) {
      return null;
    }
    return path.join(this.STORAGE_BASE_DIR, url.substring(prefix.length));
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

  private static buildRelativePath(extension: string, options: UploadOptions = {}): string {
    const parts: string[] = [];
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);

    if (options.dropType) {
      parts.push('drops');
      if (options.dropType === 'base') {
        parts.push('base');
      } else {
        parts.push('variations');
      }
    } else if (options.avatarForgeType) {
      parts.push('avatars');
      parts.push(options.avatarForgeType); // 'input' or 'output'
    } else {
      parts.push('uploads');
    }

    // Add user directory for better organization
    const userId = options.userId || config.user.defaultId;
    if (userId) {
      parts.push(userId);
    }

    return `${parts.join('/')}/${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Build thumbnail path from main image path
   */
  private static buildThumbnailPath(relativePath: string): string {
    const pathParts = relativePath.split('/');
    const fileName = pathParts.pop() || '';
    const [name, ext] = fileName.split('.');
    
    // Insert 'thumbnails' directory before filename
    if (pathParts[0] === 'avatars') {
      pathParts.push('thumbnails');
    } else if (pathParts[0] === 'drops') {
      pathParts.push('thumbnails');
    }
    
    return `${pathParts.join('/')}/${name}_thumb.${ext || 'jpg'}`;
  }
}
