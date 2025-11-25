/**
 * Avatar Metadata Service - Manages avatar organization and metadata
 * Handles collections, tags, ratings, notes, and favorites
 */

import { prisma } from '../../../infrastructure/database/prisma';
import { BadRequestError, NotFoundError } from '../../../shared/errors';
import logger from '../../../shared/utils/logger';
import { AvatarForgeRequest } from '../../../../../types';

export interface UpdateAvatarMetadataInput {
  collectionId?: string | null;
  tags?: string[];
  rating?: number | null;
  notes?: string | null;
  favorite?: boolean;
}

export interface AvatarFilters {
  collectionId?: string;
  tags?: string[];
  favorite?: boolean;
  rating?: number;
  search?: string;
  status?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class AvatarMetadataService {
  /**
   * Update avatar metadata
   */
  static async updateAvatarMetadata(
    avatarId: string,
    input: UpdateAvatarMetadataInput
  ): Promise<AvatarForgeRequest> {
    try {
      // Validate that avatar exists
      const existingAvatar = await prisma.avatarForgeRequest.findUnique({
        where: { id: avatarId },
      });

      if (!existingAvatar || existingAvatar.deletedAt) {
        throw new NotFoundError('Avatar not found');
      }

      // Validate rating if provided
      if (input.rating !== undefined && input.rating !== null) {
        if (input.rating < 1 || input.rating > 5) {
          throw new BadRequestError('Rating must be between 1 and 5');
        }
      }

      // Validate collection exists if provided
      if (input.collectionId) {
        const collection = await prisma.avatarCollection.findUnique({
          where: { id: input.collectionId },
        });

        if (!collection || collection.deletedAt) {
          throw new BadRequestError('Collection not found');
        }
      }

      // Clean up tags
      const cleanTags = input.tags?.map(tag => tag.trim()).filter(tag => tag.length > 0) || [];

      // Update avatar metadata
      const updatedAvatar = await prisma.avatarForgeRequest.update({
        where: { id: avatarId },
        data: {
          collectionId: input.collectionId,
          tags: cleanTags,
          rating: input.rating,
          notes: input.notes?.trim() || null,
          favorite: input.favorite,
        },
        include: {
          collection: true,
        },
      });

      logger.info('Avatar metadata updated', {
        avatarId,
        changes: Object.keys(input),
      });

      return updatedAvatar as AvatarForgeRequest;
    } catch (error: any) {
      logger.error('Failed to update avatar metadata', {
        error: error.message,
        avatarId,
        input,
      });
      throw error;
    }
  }

  /**
   * Get avatar with full metadata
   */
  static async getAvatarWithMetadata(avatarId: string): Promise<AvatarForgeRequest | null> {
    try {
      const avatar = await prisma.avatarForgeRequest.findUnique({
        where: { id: avatarId },
        include: {
          collection: true,
        },
      });

      if (!avatar || avatar.deletedAt) {
        return null;
      }

      return avatar as AvatarForgeRequest;
    } catch (error: any) {
      logger.error('Failed to get avatar with metadata', {
        error: error.message,
        avatarId,
      });
      throw error;
    }
  }

  /**
   * Get avatars with advanced filtering
   */
  static async getAvatarsFiltered(filters: AvatarFilters = {}): Promise<{
    avatars: AvatarForgeRequest[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        collectionId,
        tags,
        favorite,
        rating,
        search,
        status = 'completed',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        limit = 50,
        offset = 0,
      } = filters;

      // Build where clause
      const where: any = {
        deletedAt: null,
      };

      // Status filter
      if (status && status !== 'all') {
        where.status = status;
      }

      // Collection filter
      if (collectionId) {
        where.collectionId = collectionId;
      }

      // Favorite filter
      if (favorite !== undefined) {
        where.favorite = favorite;
      }

      // Rating filter
      if (rating) {
        where.rating = rating;
      }

      // Tags filter (match any of the provided tags)
      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags,
        };
      }

      // Search filter (basic text search)
      if (search && search.trim()) {
        where.OR = [
          {
            stylePrompt: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
          {
            notes: {
              contains: search.trim(),
              mode: 'insensitive',
            },
          },
        ];
      }

      // Build order by
      const orderBy: any = {};
      if (sortBy === 'rating') {
        orderBy.rating = sortOrder;
        orderBy.createdAt = 'desc'; // Secondary sort
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // Execute query
      const [avatars, total] = await Promise.all([
        prisma.avatarForgeRequest.findMany({
          where,
          include: {
            collection: true,
          },
          orderBy,
          take: limit + 1, // +1 to check for hasMore
          skip: offset,
        }),
        prisma.avatarForgeRequest.count({ where }),
      ]);

      // Check if there are more results
      const hasMore = avatars.length > limit;
      const results = hasMore ? avatars.slice(0, limit) : avatars;

      return {
        avatars: results as AvatarForgeRequest[],
        total,
        hasMore,
      };
    } catch (error: any) {
      logger.error('Failed to get filtered avatars', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  /**
   * Bulk update avatar metadata
   */
  static async bulkUpdateMetadata(
    avatarIds: string[],
    input: Partial<UpdateAvatarMetadataInput>
  ): Promise<number> {
    try {
      // Validate that all avatars exist
      const existingAvatars = await prisma.avatarForgeRequest.findMany({
        where: {
          id: { in: avatarIds },
          deletedAt: null,
        },
        select: { id: true },
      });

      if (existingAvatars.length !== avatarIds.length) {
        const existingIds = existingAvatars.map((a: { id: string }) => a.id);
        const missingIds = avatarIds.filter(id => !existingIds.includes(id));
        throw new BadRequestError(`Avatars not found: ${missingIds.join(', ')}`);
      }

      // Validate collection exists if provided
      if (input.collectionId) {
        const collection = await prisma.avatarCollection.findUnique({
          where: { id: input.collectionId },
        });

        if (!collection || collection.deletedAt) {
          throw new BadRequestError('Collection not found');
        }
      }

      // Validate rating if provided
      if (input.rating !== undefined && input.rating !== null) {
        if (input.rating < 1 || input.rating > 5) {
          throw new BadRequestError('Rating must be between 1 and 5');
        }
      }

      // Build update data
      const updateData: any = {};
      if (input.collectionId !== undefined) updateData.collectionId = input.collectionId;
      if (input.favorite !== undefined) updateData.favorite = input.favorite;
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.notes !== undefined) updateData.notes = input.notes;

      // Handle tags (merge with existing or replace)
      if (input.tags) {
        // For bulk operations, we'll replace tags
        updateData.tags = input.tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
      }

      const result = await prisma.avatarForgeRequest.updateMany({
        where: {
          id: { in: avatarIds },
          deletedAt: null,
        },
        data: updateData,
      });

      logger.info('Bulk avatar metadata updated', {
        avatarCount: result.count,
        changes: Object.keys(updateData),
      });

      return result.count;
    } catch (error: any) {
      logger.error('Failed to bulk update avatar metadata', {
        error: error.message,
        avatarIds,
        input,
      });
      throw error;
    }
  }

  /**
   * Get avatar statistics
   */
  static async getAvatarStats(): Promise<{
    totalAvatars: number;
    totalFavorites: number;
    totalRated: number;
    averageRating: number | null;
    topTags: Array<{ tag: string; count: number }>;
    collectionStats: Array<{ collectionId: string; collectionName: string; count: number }>;
  }> {
    try {
      // Get basic counts
      const [totalAvatars, totalFavorites, totalRated] = await Promise.all([
        prisma.avatarForgeRequest.count({
          where: { deletedAt: null, status: 'completed' },
        }),
        prisma.avatarForgeRequest.count({
          where: { deletedAt: null, favorite: true },
        }),
        prisma.avatarForgeRequest.count({
          where: { deletedAt: null, rating: { not: null } },
        }),
      ]);

      // Get average rating
      const ratingResult = await prisma.avatarForgeRequest.aggregate({
        where: {
          deletedAt: null,
          rating: { not: null },
        },
        _avg: {
          rating: true,
        },
      });

      // Get top tags
      const tagStats = await prisma.avatarForgeRequest.findMany({
        where: { deletedAt: null },
        select: { tags: true },
      });

      const tagCountMap = new Map<string, number>();
      tagStats.forEach((avatar: { tags: string[] }) => {
        avatar.tags.forEach((tag: string) => {
          tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
        });
      });

      const topTags = Array.from(tagCountMap.entries())
        .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
        .slice(0, 10)
        .map(([tag, count]: [string, number]) => ({ tag, count }));

      // Get collection stats
      const collectionStats = await prisma.avatarForgeRequest.groupBy({
        by: ['collectionId'],
        where: {
          deletedAt: null,
          collectionId: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      // Get collection names
      const collectionIds = collectionStats.map((stat: { collectionId: string | null; _count: { id: number } }) => stat.collectionId).filter(Boolean);
      const collections = await prisma.avatarCollection.findMany({
        where: {
          id: { in: collectionIds as string[] },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      });

      const collectionNameMap = new Map(collections.map((c: { id: string; name: string }) => [c.id, c.name]));

      const collectionStatsWithNames = collectionStats.map((stat: { collectionId: string | null; _count: { id: number } }) => ({
        collectionId: stat.collectionId!,
        collectionName: collectionNameMap.get(stat.collectionId!) || 'Unknown',
        count: stat._count.id,
      }));

      return {
        totalAvatars,
        totalFavorites,
        totalRated,
        averageRating: ratingResult._avg.rating,
        topTags,
        collectionStats: collectionStatsWithNames,
      };
    } catch (error: any) {
      logger.error('Failed to get avatar stats', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Clean up orphaned avatars (no collection exists)
   */
  static async cleanupOrphanedCollectionReferences(): Promise<number> {
    try {
      // Find avatars with collection IDs that don't exist
      const orphanedAvatars = await prisma.avatarForgeRequest.findMany({
        where: {
          collectionId: { not: null },
          collection: null, // This works because of the relation
        },
        select: { id: true },
      });

      if (orphanedAvatars.length === 0) {
        return 0;
      }

      const result = await prisma.avatarForgeRequest.updateMany({
        where: {
          id: { in: orphanedAvatars.map((a: { id: string }) => a.id) },
        },
        data: {
          collectionId: null,
        },
      });

      logger.info('Cleaned up orphaned collection references', {
        count: result.count,
      });

      return result.count;
    } catch (error: any) {
      logger.error('Failed to cleanup orphaned collection references', {
        error: error.message,
      });
      throw error;
    }
  }
}
