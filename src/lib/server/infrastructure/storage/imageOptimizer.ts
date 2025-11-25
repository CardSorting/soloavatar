/**
 * Image Optimization Service
 * Uses Sharp for image processing, compression, and thumbnail generation
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../../shared/utils/logger';
import { config } from '../config';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
}

export interface OptimizationOptions {
  quality?: number; // 1-100, default 85
  maxWidth?: number; // Max width, maintains aspect ratio
  maxHeight?: number; // Max height, maintains aspect ratio
  format?: 'jpeg' | 'png' | 'webp'; // Output format
  progressive?: boolean; // Progressive JPEG
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageOptimizer {
  /**
   * Get image metadata without loading full image
   */
  static async getMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(filePath).metadata();
      const stats = await fs.stat(filePath);

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: stats.size,
        hasAlpha: metadata.hasAlpha || false,
      };
    } catch (error: any) {
      logger.error('Failed to get image metadata', { filePath, error: error.message });
      throw new Error(`Failed to read image metadata: ${error.message}`);
    }
  }

  /**
   * Optimize image with compression and resizing
   */
  static async optimize(
    inputPath: string,
    outputPath: string,
    options: OptimizationOptions = {}
  ): Promise<ImageMetadata> {
    try {
      const {
        quality = 85,
        maxWidth,
        maxHeight,
        format,
        progressive = true,
      } = options;

      let pipeline = sharp(inputPath);

      // Resize if needed
      if (maxWidth || maxHeight) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert format and apply compression
      if (format === 'jpeg' || (!format && path.extname(inputPath).toLowerCase() !== '.png')) {
        pipeline = pipeline.jpeg({
          quality,
          progressive,
          mozjpeg: true, // Better compression
        });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({
          quality,
          effort: 4, // Balance between speed and compression
        });
      } else if (format === 'png') {
        pipeline = pipeline.png({
          quality,
          compressionLevel: 9,
          adaptiveFiltering: true,
        });
      }

      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Write optimized image
      await pipeline.toFile(outputPath);

      // Get metadata of optimized image
      const stats = await fs.stat(outputPath);
      const metadata = await sharp(outputPath).metadata();

      logger.info('Image optimized', {
        inputPath,
        outputPath,
        originalSize: (await fs.stat(inputPath)).size,
        optimizedSize: stats.size,
        compressionRatio: ((1 - stats.size / (await fs.stat(inputPath)).size) * 100).toFixed(1) + '%',
      });

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: stats.size,
        hasAlpha: metadata.hasAlpha || false,
      };
    } catch (error: any) {
      logger.error('Image optimization failed', {
        inputPath,
        outputPath,
        error: error.message,
      });
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail from image
   */
  static async generateThumbnail(
    inputPath: string,
    outputPath: string,
    options: ThumbnailOptions
  ): Promise<ImageMetadata> {
    try {
      const { width, height, quality = 80, format = 'jpeg' } = options;

      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      let pipeline = sharp(inputPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        });

      if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality, progressive: true });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      } else {
        pipeline = pipeline.png({ quality: Math.min(quality, 9) });
      }

      await pipeline.toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const metadata = await sharp(outputPath).metadata();

      logger.debug('Thumbnail generated', {
        inputPath,
        outputPath,
        dimensions: `${width}x${height}`,
        size: stats.size,
      });

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: stats.size,
        hasAlpha: metadata.hasAlpha || false,
      };
    } catch (error: any) {
      logger.error('Thumbnail generation failed', {
        inputPath,
        outputPath,
        error: error.message,
      });
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Optimize image in place (overwrites original)
   */
  static async optimizeInPlace(
    filePath: string,
    options: OptimizationOptions = {}
  ): Promise<ImageMetadata> {
    const tempPath = `${filePath}.tmp`;
    try {
      const result = await this.optimize(filePath, tempPath, options);
      // Replace original with optimized version
      await fs.rename(tempPath, filePath);
      return result;
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Validate image file (check if it's a valid image)
   */
  static async validateImage(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata();
      return metadata.width !== undefined && metadata.height !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get optimal format for image based on content
   */
  static async getOptimalFormat(filePath: string): Promise<'jpeg' | 'png' | 'webp'> {
    try {
      const metadata = await sharp(filePath).metadata();
      const hasAlpha = metadata.hasAlpha || false;

      // PNG for images with transparency
      if (hasAlpha) {
        return 'png';
      }

      // WebP for better compression (if supported)
      // JPEG as fallback
      return 'webp';
    } catch {
      return 'jpeg';
    }
  }
}

