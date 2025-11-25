/**
 * Drop Service - Simplified for instant personal drops
 * No scheduling - drops are created and available immediately
 */

import { prisma } from '../../../infrastructure/database/prisma';
import { BadRequestError, InternalServerError } from '../../../shared/errors';
import logger from '../../../shared/utils/logger';

export interface CreateDropInput {
  baseAvatarId: string;
  title: string;
  description?: string;
  stockLimit: number;
  collectionName?: string;
  traitConfig?: any;
}

export interface DropInfo {
  id: string;
  baseAvatarId: string;
  title: string;
  description: string | null;
  stockLimit: number;
  stockAvailable: number;
  collectionName: string | null;
  traitConfig: any;
  generationStatus: string | null;
  generationProgress: number | null;
  createdAt: Date;
  baseAvatar: {
    id: string;
    outputImageUrl: string | null;
  };
}

export class DropService {
  /**
   * Create a new drop instantly (no scheduling)
   */
  static async createDrop(input: CreateDropInput): Promise<DropInfo> {
    try {
      // Validate inputs
      if (!input.baseAvatarId) {
        throw new BadRequestError('Base avatar ID is required');
      }

      if (!input.title || input.title.trim().length === 0) {
        throw new BadRequestError('Title is required');
      }

      if (input.stockLimit <= 0) {
        throw new BadRequestError('Stock limit must be greater than 0');
      }

      // Verify base avatar exists and is completed
      const baseAvatar = await prisma.avatarForgeRequest.findUnique({
        where: { id: input.baseAvatarId },
      });

      if (!baseAvatar) {
        throw new BadRequestError('Base avatar not found');
      }

      if (baseAvatar.status !== 'completed' || !baseAvatar.outputImageUrl) {
        throw new BadRequestError('Base avatar must be completed before creating a drop');
      }

      // Create drop (instantly available) - All drops belong to the single user
      const drop = await prisma.dropListing.create({
        data: {
          baseAvatarId: input.baseAvatarId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          stockLimit: input.stockLimit,
          stockAvailable: input.stockLimit,
          collectionName: input.collectionName?.trim() || null,
          traitConfig: input.traitConfig || null,
          generationStatus: 'pending',
          generationProgress: 0,
        },
        include: {
          baseAvatar: {
            select: {
              id: true,
              outputImageUrl: true,
            },
          },
        },
      });

      logger.info('Drop created instantly', {
        dropId: drop.id,
        stockLimit: input.stockLimit,
      });

      return drop as DropInfo;
    } catch (error: any) {
      logger.error('Failed to create drop', {
        error: error.message,
        input,
      });
      throw error;
    }
  }

  /**
   * Get drop by ID
   */
  static async getDropById(dropId: string): Promise<DropInfo | null> {
    const drop = await prisma.dropListing.findUnique({
      where: { id: dropId },
      include: {
        baseAvatar: {
          select: {
            id: true,
            outputImageUrl: true,
          },
        },
      },
    });

    return drop as DropInfo | null;
  }

  /**
   * Get all drops (personal gallery - single user system)
   */
  static async getAllDrops(limit: number = 50): Promise<DropInfo[]> {
    const drops = await prisma.dropListing.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        baseAvatar: {
          select: {
            id: true,
            outputImageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return drops as DropInfo[];
  }

  /**
   * Get user's drops (for single user system)
   */
  static async getUserDrops(userId: string): Promise<DropInfo[]> {
    // In single-user system, all drops belong to the user
    // This method is kept for API compatibility but returns all drops
    return this.getAllDrops();
  }

  /**
   * Delete drop (soft delete) - Single user, no authorization needed
   */
  static async deleteDrop(dropId: string): Promise<void> {
    const drop = await prisma.dropListing.findUnique({
      where: { id: dropId },
    });

    if (!drop || drop.deletedAt) {
      throw new BadRequestError('Drop not found');
    }

    await prisma.dropListing.update({
      where: { id: dropId },
      data: {
        deletedAt: new Date(),
      },
    });

    logger.info('Drop deleted', { dropId });
  }
}
