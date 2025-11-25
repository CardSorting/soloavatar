/**
 * Replicate Service - Wrapper for Replicate API
 * Handles trait-based avatar generation for drop variations
 */

import Replicate from 'replicate';
import { config } from '../../../infrastructure/config';
import { BadRequestError, InternalServerError } from '../../../shared/errors';
import logger from '../../../shared/utils/logger';

export interface ReplicateGenerationInput {
  prompt: string;
  imageInput?: string[]; // Base64 or URLs
  resolution?: '1K' | '2K' | '4K';
  aspectRatio?: string;
  outputFormat?: 'jpg' | 'png';
  safetyFilterLevel?: 'block_low_and_above' | 'block_medium_and_above' | 'block_only_high';
}

export interface ReplicateGenerationResult {
  url: string;
  dataUrl?: string; // If we convert to data URL
}

export class ReplicateService {
  private static client: Replicate | null = null;
  private static readonly MODEL = 'google/nano-banana-pro';
  private static readonly DEFAULT_TIMEOUT_MS = 120000; // 2 minutes

  /**
   * Initialize Replicate client
   */
  private static getClient(): Replicate {
    if (!this.client) {
      if (!config.replicate.enabled || !config.replicate.apiToken) {
        throw new InternalServerError('Replicate API is not configured');
      }

      this.client = new Replicate({
        auth: config.replicate.apiToken,
      });

      logger.info('Replicate client initialized');
    }

    return this.client;
  }

  /**
   * Generate image using Replicate API
   */
  static async generateImage(
    input: ReplicateGenerationInput
  ): Promise<ReplicateGenerationResult> {
    const startTime = Date.now();

    try {
      if (!config.replicate.enabled) {
        throw new InternalServerError('Replicate API is not enabled');
      }

      const client = this.getClient();

      // Validate inputs
      if (!input.prompt || input.prompt.trim().length === 0) {
        throw new BadRequestError('Prompt is required');
      }

      // Prepare input for Replicate
      const replicateInput: any = {
        prompt: input.prompt.trim(),
        resolution: input.resolution || '2K',
        aspect_ratio: input.aspectRatio || 'match_input_image',
        output_format: input.outputFormat || 'jpg',
        safety_filter_level: input.safetyFilterLevel || 'block_only_high',
      };

      // Add image inputs if provided
      if (input.imageInput && input.imageInput.length > 0) {
        replicateInput.image_input = input.imageInput.slice(0, 14); // Max 14 images
      }

      logger.info('Generating image with Replicate', {
        model: this.MODEL,
        promptLength: input.prompt.length,
        hasImageInput: Boolean(input.imageInput && input.imageInput.length > 0),
      });

      // Run the model
      const output = await Promise.race([
        client.run(this.MODEL, { input: replicateInput }),
        this.createTimeoutPromise(this.DEFAULT_TIMEOUT_MS),
      ]) as any;

      const duration = Date.now() - startTime;

      // Handle output - Replicate can return different formats
      // Based on the example: output.url() method or direct URL string
      let imageUrl: string;
      
      if (typeof output === 'string') {
        // Direct URL string
        imageUrl = output;
      } else if (output && typeof output === 'object') {
        // Check for url() method
        if (typeof output.url === 'function') {
          imageUrl = output.url();
        } else if ('url' in output && typeof output.url === 'string') {
          imageUrl = output.url;
        } else if (Array.isArray(output) && output.length > 0) {
          // Sometimes Replicate returns an array of URLs
          imageUrl = typeof output[0] === 'string' ? output[0] : String(output[0]);
        } else {
          // Try to stringify and extract URL
          const outputStr = JSON.stringify(output);
          const urlMatch = outputStr.match(/https?:\/\/[^\s"']+/);
          if (urlMatch) {
            imageUrl = urlMatch[0];
          } else {
            throw new InternalServerError('Unexpected output format from Replicate');
          }
        }
      } else {
        throw new InternalServerError('Unexpected output format from Replicate');
      }

      logger.info('Image generated successfully via Replicate', {
        duration: `${duration}ms`,
        imageUrl: imageUrl.substring(0, 100) + '...',
      });

      return {
        url: imageUrl,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error instanceof BadRequestError || error instanceof InternalServerError) {
        logger.warn('Replicate service error', {
          error: error.message,
          duration: `${duration}ms`,
        });
        throw error;
      }

      if (error.message && error.message.includes('timeout')) {
        throw new InternalServerError('Image generation timed out. Please try again.');
      }

      logger.error('Replicate API error', {
        error: error.message,
        duration: `${duration}ms`,
      });

      throw new InternalServerError('Failed to generate image with Replicate. Please try again.');
    }
  }

  /**
   * Create a timeout promise
   */
  private static createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Replicate API call timed out'));
      }, timeoutMs);
    });
  }

  /**
   * Check if Replicate is available
   */
  static isAvailable(): boolean {
    return config.replicate.enabled && Boolean(config.replicate.apiToken);
  }
}

