/**
 * Collection Service - Manages avatar and drop collections
 * Provides organization and grouping functionality
 */

import { prisma } from '../../../infrastructure/database/prisma';
import { BadRequestError, NotFoundError } from '../../../shared/errors';
import logger from '../../../shared/utils/logger';
import { AvatarCollection } from '../../../../../types';

export interface CreateCollectionInput {
  name: string;
  description?: string;
  color?: string;
  coverImageUrl?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string;
  color?: string;
  coverImageUrl?: string;
}

export interface AddItemsInput {
  avatarIds: string[];
}

export interface RemoveItemsInput {
  avatarIds: string[];
}

export class CollectionService {
  /**
   * Create a new collection
   */
  static async createCollection(input: CreateCollectionInput): Promise<AvatarCollection> {
    try {
      // Validate inputs
      if (!input.name || input.name.trim().length === 0) {
        throw new BadRequestError('Collection name is required');
      }

      if (input.name.trim().length > 255) {
        throw new BadRequestError('Collection name must be less than 255 characters');
      }

      // Create collection
      const collection = await prisma.avatarCollection.create({
        data: {
          name: input.name.trim(),
          description: input.description?.trim() || null,
          color: input.color?.trim() || null,
          coverImageUrl: input.coverImageUrl?.trim() || null,
        },
      });

      logger.info('Collection created', {
        collectionId: collection.id,
        name: collection.name,
      });

      return collection as AvatarCollection;
    } catch (error: any) {
      logger.error('Failed to create collection', {
        error: error.message,
        input,
      });
      throw error;
    }
  }

  /**
   * Get collection by ID
   */
  static async getCollectionById(collectionId: string): Promise<AvatarCollection | null> {
    try {
      const collection = await prisma.avatarCollection.findUnique({
        where: { id: collectionId },
        include: {
          avatars: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return collection ? (collection as AvatarCollection & { avatars: any[] }) : null;
    } catch (error: any) {
      logger.error('Failed to get collection', {
        error: error.message,
        collectionId,
      });
      throw error;
    }
  }

  /**
   * Get all collections (active only)
   */
  static async getCollections(): Promise<AvatarCollection[]> {
    try {
      const collections = await prisma.avatarCollection.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              avatars: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return collections.map((collection: any) => ({
        ...collection,
        avatarCount: (collection as any)._count.avatars,
      })) as (AvatarCollection & { avatarCount: number })[];
    } catch (error: any) {
      logger.error('Failed to get collections', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update collection
   */
  static async updateCollection(
    collectionId: string,
    input: UpdateCollectionInput
  ): Promise<AvatarCollection> {
    try {
      // Validate that collection exists
      const existingCollection = await prisma.avatarCollection.findUnique({
        where: { id: collectionId },
      });

      if (!existingCollection || existingCollection.deletedAt) {
        throw new NotFoundError('Collection not found');
      }

      // Validate inputs
      if (input.name && input.name.trim().length === 0) {
        throw new BadRequestError('Collection name cannot be empty');
      }

      if (input.name && input.name.trim().length > 255) {
        throw new BadRequestError('Collection name must be less than 255 characters');
      }

      // Update collection
      const updatedCollection = await prisma.avatarCollection.update({
        where: { id: collectionId },
        data: {
          name: input.name?.trim(),
          description: input.description?.trim() || null,
          color: input.color?.trim() || null,
          coverImageUrl: input.coverImageUrl?.trim() || null,
        },
      });

      logger.info('Collection updated', {
        collectionId,
        changes: Object.keys(input),
      });

      return updatedCollection as AvatarCollection;
    } catch (error: any) {
      logger.error('Failed to update collection', {
        error: error.message,
        collectionId,
        input,
      });
      throw error;
    }
  }

  /**
   * Delete collection (soft delete)
   */
  static async deleteCollection(collectionId: string): Promise<void> {
    try {
      // Validate that collection exists
      const collection = await prisma.avatarCollection.findUnique({
        where: { id: collectionId },
      });

      if (!collection || collection.deletedAt) {
        throw new NotFoundError('Collection not found');
      }

      // Soft delete collection
      await prisma.avatarCollection.update({
        where: { id: collectionId },
        data: {
          deletedAt: new Date(),
        },
      });

      logger.info('Collection deleted', { collectionId });
    } catch (error: any) {
      logger.error('Failed to delete collection', {
        error: error.message,
        collectionId,
      });
      throw error;
    }
  }

  /**
   * Add avatars to collection
   */
  static async addItemsToCollection(
    collectionId: string,
    input: AddItemsInput
  ): Promise<void> {
    try {
      // Validate that collection exists
      const collection = await prisma.avatarCollection.findUnique({
        where: { id: collectionId },
      });

      if (!collection || collection.deletedAt) {
        throw new NotFoundError('Collection not found');
      }

      // Validate that avatars exist
      if (input.avatarIds.length > 0) {
        const existingAvatars = await prisma.avatarForgeRequest.findMany({
          where: {
            id: { in: input.avatarIds },
            deletedAt: null,
          },
          select: { id: true },
        });

        const existingIds = existingAvatars.map(a => a.id);
        const invalidIds = input.avatarIds.filter(id => !existingIds.includes(id));

        if (invalidIds.length > 0) {
          throw new BadRequestError(`Invalid avatar IDs: ${invalidIds.join(', ')}`);
        }

        // Update avatars to belong to this collection
        await prisma.avatarForgeRequest.updateMany({
          where: {
            id: { in: input.avatarIds },
            deletedAt: null,
          },
          data: {
            collectionId,
          },
        });
      }

      logger.info('Items added to collection', {
        collectionId,
        avatarCount: input.avatarIds.length,
      });
    } catch (error: any) {
      logger.error('Failed to add items to collection', {
        error: error.message,
        collectionId,
        input,
      });
      throw error;
    }
  }

  /**
   * Remove avatars from collection
   */
  static async removeItemsFromCollection(
    collectionId: string,
    input: RemoveItemsInput
  ): Promise<void> {
    try {
      // Validate that collection exists
      const collection = await prisma.avatarCollection.findUnique({
        where: { id: collectionId },
      });

      if (!collection || collection.deletedAt) {
        throw new NotFoundError('Collection not found');
      }

      // Remove avatars from collection (set collectionId to null)
      if (input.avatarIds.length > 0) {
        await prisma.avatarForgeRequest.updateMany({
          where: {
            id: { in: input.avatarIds },
            collectionId,
          },
          data: {
            collectionId: null,
          },
        });
      }

      logger.info('Items removed from collection', {
        collectionId,
        avatarCount: input.avatarIds.length,
      });
    } catch (error: any) {
      logger.error('Failed to remove items from collection', {
        error: error.message,
        collectionId,
        input,
      });
      throw error;
    }
  }

  /**
   * Search collections by name
   */
  static async searchCollections(query: string): Promise<AvatarCollection[]> {
    try {
      if (!query || query.trim().length === 0) {
        return this.getCollections();
      }

      const collections = await prisma.avatarCollection.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              name: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          _count: {
            select: {
              avatars: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return collections.map(collection => ({
        ...collection,
        avatarCount: collection._count.avatars,
      })) as (AvatarCollection & { avatarCount: number })[];
    } catch (error: any) {
      logger.error('Failed to search collections', {
        error: error.message,
        query,
      });
      throw error;
    }
  }
}
