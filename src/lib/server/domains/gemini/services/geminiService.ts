import { GoogleGenAI, Modality } from '@google/genai';
import { config } from '../../../infrastructure/config';
import logger from '../../../shared/utils/logger';
import { BadRequestError, InternalServerError } from '../../../shared/errors';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PROMPT_LENGTH = 5000;
const MIN_PROMPT_LENGTH = 10;
const GEMINI_API_TIMEOUT_MS = 60000; // 60 seconds
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

const stripBase64Prefix = (base64Str: string): string => {
  return base64Str.replace(/^data:image\/\w+;base64,/, '');
};

const getMimeType = (base64Str: string): string => {
  const match = base64Str.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : 'image/png';
};

const getBase64Size = (base64Str: string): number => {
  const base64Data = stripBase64Prefix(base64Str);
  return Math.ceil((base64Data.length * 3) / 4);
};

const validateImageFormat = (base64Str: string, fieldName: string): void => {
  const mimeType = getMimeType(base64Str);
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase())) {
    throw new BadRequestError(
      `${fieldName} must be one of: PNG, JPEG, JPG, GIF, or WEBP. Received: ${mimeType}`
    );
  }
};

const validateImageSize = (base64Str: string, fieldName: string): void => {
  const size = getBase64Size(base64Str);
  if (size > MAX_IMAGE_SIZE_BYTES) {
    const maxSizeMB = (MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(2);
    throw new BadRequestError(`${fieldName} is too large. Maximum size is ${maxSizeMB}MB.`);
  }
  if (size === 0) {
    throw new BadRequestError(`${fieldName} appears to be empty or invalid.`);
  }
};

const sanitizePrompt = (prompt: string): string => {
  let sanitized = prompt.trim().replace(/\s+/g, ' ');
  sanitized = sanitized.replace(/[<>]/g, '');
  return sanitized;
};

const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new InternalServerError('Request timeout: Gemini API did not respond in time'));
    }, timeoutMs);
  });
};

export interface GenerateImageRequest {
  baseImageBase64: string;
  overlayImageBase64: string | null;
  prompt: string;
}

export class GeminiService {
  private static ai: GoogleGenAI | null = null;

  private static initializeClient(): GoogleGenAI {
    if (!config.gemini.enabled || !config.gemini.apiKey) {
      throw new InternalServerError('Gemini API is not configured');
    }

    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
      logger.info('Gemini AI client initialized');
    }

    return this.ai;
  }

  static async generateEditedImage(request: GenerateImageRequest): Promise<string> {
    const startTime = Date.now();
    
    try {
      const { baseImageBase64, overlayImageBase64, prompt } = request;

      if (!baseImageBase64 || typeof baseImageBase64 !== 'string') {
        throw new BadRequestError('Base image is required and must be a string');
      }

      if (!prompt || typeof prompt !== 'string') {
        throw new BadRequestError('Prompt is required and must be a string');
      }

      const sanitizedPrompt = sanitizePrompt(prompt);
      
      if (sanitizedPrompt.length < MIN_PROMPT_LENGTH) {
        throw new BadRequestError(`Prompt must be at least ${MIN_PROMPT_LENGTH} characters long`);
      }

      if (sanitizedPrompt.length > MAX_PROMPT_LENGTH) {
        throw new BadRequestError(`Prompt must be less than ${MAX_PROMPT_LENGTH} characters long`);
      }

      validateImageFormat(baseImageBase64, 'Base image');
      validateImageSize(baseImageBase64, 'Base image');

      if (overlayImageBase64) {
        if (typeof overlayImageBase64 !== 'string') {
          throw new BadRequestError('Overlay image must be a string if provided');
        }
        validateImageFormat(overlayImageBase64, 'Overlay image');
        validateImageSize(overlayImageBase64, 'Overlay image');
      }

      const ai = this.initializeClient();

      const parts: Array<{
        inlineData?: { mimeType: string; data: string };
        text?: string;
      }> = [];

      parts.push({
        inlineData: {
          mimeType: getMimeType(baseImageBase64),
          data: stripBase64Prefix(baseImageBase64),
        },
      });

      if (overlayImageBase64) {
        parts.push({
          inlineData: {
            mimeType: getMimeType(overlayImageBase64),
            data: stripBase64Prefix(overlayImageBase64),
          },
        });
      }

      parts.push({
        text: sanitizedPrompt,
      });

      logger.info('Generating image with Gemini API', {
        hasOverlay: Boolean(overlayImageBase64),
        promptLength: sanitizedPrompt.length,
      });

      const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const timeoutPromise = createTimeoutPromise(GEMINI_API_TIMEOUT_MS);
      const response = await Promise.race([apiCall, timeoutPromise]);

      const generatedPart = response.candidates?.[0]?.content?.parts?.[0];

      if (!generatedPart?.inlineData?.data) {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
          throw new BadRequestError(`Image generation was blocked. Reason: ${finishReason}`);
        }
        throw new InternalServerError('No image data received from Gemini API');
      }

      const imageDataUrl = `data:image/png;base64,${generatedPart.inlineData.data}`;
      const duration = Date.now() - startTime;

      logger.info('Image generated successfully via Gemini API', {
        duration: `${duration}ms`,
      });

      return imageDataUrl;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error instanceof BadRequestError || error instanceof InternalServerError) {
        logger.warn('Gemini service error', {
          error: error.message,
          duration: `${duration}ms`,
        });
        throw error;
      }

      if (error.message && error.message.includes('timeout')) {
        throw new InternalServerError('Image generation timed out. Please try again.');
      }

      logger.error('Gemini API error', {
        error: error.message,
        duration: `${duration}ms`,
      });

      throw new InternalServerError('Failed to generate image. Please try again.');
    }
  }
}

