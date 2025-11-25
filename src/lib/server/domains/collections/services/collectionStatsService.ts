/**
 * Collection Statistics Service
 * Calculates and manages collection statistics
 */

import { prisma } from '../../../infrastructure/database/prisma';
import logger from '../../../shared/utils/logger';

export interface CollectionStatistics {
  totalAvatars: number;
  totalDrops: number;
  totalVariations: number;
  totalFavorites: number;
  averageRating: number | null;
  rarityDistribution: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    epic: number;
    legendary: number;
  };
  topTags: Array<{ tag: string; count: number }>;
  storageUsed: number; // In bytes (simplified - would need actual file size tracking)
  collectionsCount: number;
  completedAvatars: number;
  pendingAvatars: number;
  failedAvatars: number;
}

export class CollectionStatsService {
  /**
   * Calculate comprehensive collection statistics
   */
  static async calculateStatistics(): Promise<CollectionStatistics> {
    try {
      // Get basic counts
      const [
        totalAvatars,
        totalDrops,
        totalVariations,
        totalFavorites,
        collectionsCount,
        completedAvatars,
        pendingAvatars,
        failedAvatars,
      ] = await Promise.all([
        prisma.avatarForgeRequest.count({
          where: { deletedAt: null },
        }),
        prisma.dropListing.count({
          where: { deletedAt: null },
        }),
        prisma.dropGeneratedAvatar.count(),
        prisma.avatarForgeRequest.count({
          where: {
            deletedAt: null,
            favorite: true,
          },
        }),
        prisma.avatarCollection.count({
          where: { deletedAt: null },
        }),
        prisma.avatarForgeRequest.count({
          where: {
            deletedAt: null,
            status: 'completed',
          },
        }),
        prisma.avatarForgeRequest.count({
          where: {
            deletedAt: null,
            status: 'pending',
          },
        }),
        prisma.avatarForgeRequest.count({
          where: {
            deletedAt: null,
            status: 'failed',
          },
        }),
      ]);

      // Calculate average rating
      const ratingsResult = await prisma.avatarForgeRequest.aggregate({
        where: {
          deletedAt: null,
          rating: { not: null },
        },
        _avg: {
          rating: true,
        },
      });
      const averageRating = ratingsResult._avg.rating;

      // Get rarity distribution
      const rarityCounts = await prisma.dropGeneratedAvatar.groupBy({
        by: ['rarity'],
        _count: {
          rarity: true,
        },
      });

      const rarityDistribution = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };

      rarityCounts.forEach((item) => {
        if (item.rarity in rarityDistribution) {
          rarityDistribution[item.rarity as keyof typeof rarityDistribution] = item._count.rarity;
        }
      });

      // Get top tags
      const allAvatars = await prisma.avatarForgeRequest.findMany({
        where: {
          deletedAt: null,
          tags: { isEmpty: false },
        },
        select: {
          tags: true,
        },
      });

      const tagCounts: Record<string, number> = {};
      allAvatars.forEach((avatar) => {
        if (avatar.tags && Array.isArray(avatar.tags)) {
          avatar.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Storage used (simplified - would need actual file tracking)
      // For now, estimate based on number of images
      const storageUsed = (totalAvatars + totalVariations) * 500000; // Estimate 500KB per image

      return {
        totalAvatars,
        totalDrops,
        totalVariations,
        totalFavorites,
        averageRating: averageRating ? Number(averageRating.toFixed(2)) : null,
        rarityDistribution,
        topTags,
        storageUsed,
        collectionsCount,
        completedAvatars,
        pendingAvatars,
        failedAvatars,
      };
    } catch (error: any) {
      logger.error('Failed to calculate statistics', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get quick statistics (lightweight)
   */
  static async getQuickStats(): Promise<{
    totalAvatars: number;
    totalDrops: number;
    totalCollections: number;
  }> {
    try {
      const [totalAvatars, totalDrops, totalCollections] = await Promise.all([
        prisma.avatarForgeRequest.count({
          where: { deletedAt: null },
        }),
        prisma.dropListing.count({
          where: { deletedAt: null },
        }),
        prisma.avatarCollection.count({
          where: { deletedAt: null },
        }),
      ]);

      return {
        totalAvatars,
        totalDrops,
        totalCollections,
      };
    } catch (error: any) {
      logger.error('Failed to get quick stats', {
        error: error.message,
      });
      throw error;
    }
  }
}

