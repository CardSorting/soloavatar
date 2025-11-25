import { NextRequest, NextResponse } from 'next/server';
import { AvatarService } from '@/lib/server/domains/gemini/services/avatarService';
import { AvatarMetadataService } from '@/lib/server/domains/gemini/services/avatarMetadataService';
import { DropService } from '@/lib/server/domains/drops/services/dropService';
import logger from '@/lib/server/shared/utils/logger';

/**
 * Personal Gallery API
 * Returns both avatars and drops for a user with filtering and search
 * 
 * Query params:
 * - type: 'avatar' | 'drop' | 'all' (default: 'all')
 * - collectionId: Filter by collection
 * - tags: Comma-separated tags
 * - favorite: 'true' | 'false'
 * - status: Filter avatars by status
 * - search: Search query
 * - sortBy: 'createdAt' | 'updatedAt' | 'rating' | 'title'
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * - limit: Number of items (default: 50)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const collectionId = searchParams.get('collectionId');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const favorite = searchParams.get('favorite');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filters for avatars
    const avatarFilters: any = {};
    if (collectionId) avatarFilters.collectionId = collectionId;
    if (tags && tags.length > 0) avatarFilters.tags = tags;
    if (favorite !== null) avatarFilters.favorite = favorite === 'true';
    if (status) avatarFilters.status = status;
    if (search) avatarFilters.search = search;
    avatarFilters.sortBy = sortBy as 'createdAt' | 'updatedAt' | 'rating';
    avatarFilters.sortOrder = sortOrder;
    avatarFilters.limit = limit * 2; // Get more to account for drops
    avatarFilters.offset = 0;

    // Fetch avatars and drops based on type filter
    const promises: Promise<any>[] = [];
    
    if (type === 'all' || type === 'avatar') {
      promises.push(
        AvatarMetadataService.getAvatarsFiltered(avatarFilters).then(result => result.avatars)
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    if (type === 'all' || type === 'drop') {
      promises.push(DropService.getUserDrops(params.userId));
    } else {
      promises.push(Promise.resolve([]));
    }

    const [avatars, drops] = await Promise.all(promises);

    // Combine and format items
    const gallery = [
      ...avatars.map((avatar: any) => ({
        type: 'avatar' as const,
        id: avatar.id,
        imageUrl: avatar.outputImageUrl,
        createdAt: avatar.createdAt,
        updatedAt: avatar.updatedAt,
        title: avatar.stylePrompt ? `Avatar - ${avatar.stylePrompt.substring(0, 30)}...` : 'Avatar',
        status: avatar.status,
        tags: avatar.tags || [],
        favorite: avatar.favorite || false,
        rating: avatar.rating,
        collectionId: avatar.collectionId,
      })),
      ...drops.map((drop: any) => ({
        type: 'drop' as const,
        id: drop.id,
        imageUrl: drop.baseAvatar?.outputImageUrl,
        createdAt: drop.createdAt,
        updatedAt: drop.updatedAt,
        title: drop.title,
        stockAvailable: drop.stockAvailable,
        stockLimit: drop.stockLimit,
        generationStatus: drop.generationStatus,
      })),
    ];

    // Apply search filter to combined results if needed
    let filteredGallery = gallery;
    if (search && type === 'all') {
      const searchLower = search.toLowerCase();
      filteredGallery = gallery.filter((item) => {
        if (item.type === 'avatar') {
          return (
            item.title.toLowerCase().includes(searchLower) ||
            (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
          );
        } else {
          return item.title.toLowerCase().includes(searchLower);
        }
      });
    }

    // Sort combined results
    filteredGallery.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'updatedAt':
          aValue = new Date(a.updatedAt || a.createdAt).getTime();
          bValue = new Date(b.updatedAt || b.createdAt).getTime();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // Apply pagination
    const paginatedGallery = filteredGallery.slice(offset, offset + limit);

    return NextResponse.json({
      userId: params.userId,
      items: paginatedGallery,
      pagination: {
        total: filteredGallery.length,
        limit,
        offset,
        hasMore: offset + limit < filteredGallery.length,
      },
      stats: {
        avatars: avatars.length,
        drops: drops.length,
        total: filteredGallery.length,
      },
      filters: {
        type,
        collectionId,
        tags,
        favorite: favorite ? favorite === 'true' : undefined,
        status,
        search,
        sortBy,
        sortOrder,
      },
    });
  } catch (error: any) {
    logger.error('Get gallery API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get gallery' },
      { status: 500 }
    );
  }
}

