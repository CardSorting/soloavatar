import { NextRequest, NextResponse } from 'next/server';
import { AvatarMetadataService } from '@/lib/server/domains/gemini/services/avatarMetadataService';
import { DropService } from '@/lib/server/domains/drops/services/dropService';
import { CollectionService } from '@/lib/server/domains/collections/services/collectionService';
import logger from '@/lib/server/shared/utils/logger';

/**
 * GET /api/search
 * Full-text search across avatars, drops, and collections
 * 
 * Query params:
 * - q: Search query (required)
 * - type: 'avatar' | 'drop' | 'collection' | 'all' (default: 'all')
 * - limit: Number of results (default: 20)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const searchTerm = query.trim();
    const results: any[] = [];

    // Search avatars
    if (type === 'all' || type === 'avatar') {
      const avatarResults = await AvatarMetadataService.getAvatarsFiltered({
        search: searchTerm,
        limit: limit * 2, // Get more to account for other types
        offset: 0,
      });

      results.push(
        ...avatarResults.avatars.map((avatar: any) => ({
          type: 'avatar' as const,
          id: avatar.id,
          title: avatar.stylePrompt ? `Avatar - ${avatar.stylePrompt.substring(0, 50)}...` : 'Avatar',
          imageUrl: avatar.outputImageUrl,
          createdAt: avatar.createdAt,
          tags: avatar.tags || [],
          favorite: avatar.favorite || false,
          rating: avatar.rating,
          matchScore: calculateMatchScore(avatar, searchTerm),
        }))
      );
    }

    // Search drops
    if (type === 'all' || type === 'drop') {
      const allDrops = await DropService.getAllDrops(limit * 2);
      const matchingDrops = allDrops.filter((drop: any) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          drop.title.toLowerCase().includes(searchLower) ||
          (drop.description && drop.description.toLowerCase().includes(searchLower)) ||
          (drop.collectionName && drop.collectionName.toLowerCase().includes(searchLower))
        );
      });

      results.push(
        ...matchingDrops.map((drop: any) => ({
          type: 'drop' as const,
          id: drop.id,
          title: drop.title,
          imageUrl: drop.baseAvatar?.outputImageUrl,
          createdAt: drop.createdAt,
          stockAvailable: drop.stockAvailable,
          stockLimit: drop.stockLimit,
          matchScore: calculateMatchScore(drop, searchTerm),
        }))
      );
    }

    // Search collections
    if (type === 'all' || type === 'collection') {
      const matchingCollections = await CollectionService.searchCollections(searchTerm);
      results.push(
        ...matchingCollections.map((collection: any) => ({
          type: 'collection' as const,
          id: collection.id,
          title: collection.name,
          description: collection.description,
          createdAt: collection.createdAt,
          avatarCount: collection.avatarCount || 0,
          matchScore: calculateMatchScore(collection, searchTerm),
        }))
      );
    }

    // Sort by match score (higher is better)
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);

    return NextResponse.json({
      query: searchTerm,
      results: paginatedResults,
      pagination: {
        total: results.length,
        limit,
        offset,
        hasMore: offset + limit < results.length,
      },
      counts: {
        avatars: results.filter(r => r.type === 'avatar').length,
        drops: results.filter(r => r.type === 'drop').length,
        collections: results.filter(r => r.type === 'collection').length,
        total: results.length,
      },
    });
  } catch (error: any) {
    logger.error('Search API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

/**
 * Calculate match score for search results
 */
function calculateMatchScore(item: any, searchTerm: string): number {
  const searchLower = searchTerm.toLowerCase();
  let score = 0;

  // Title/name match (highest weight)
  if (item.title && item.title.toLowerCase().includes(searchLower)) {
    score += 10;
    if (item.title.toLowerCase().startsWith(searchLower)) {
      score += 5; // Bonus for starting with search term
    }
  }

  if (item.name && item.name.toLowerCase().includes(searchLower)) {
    score += 10;
    if (item.name.toLowerCase().startsWith(searchLower)) {
      score += 5;
    }
  }

  // Description match
  if (item.description && item.description.toLowerCase().includes(searchLower)) {
    score += 3;
  }

  // Tags match
  if (item.tags && Array.isArray(item.tags)) {
    const matchingTags = item.tags.filter((tag: string) =>
      tag.toLowerCase().includes(searchLower)
    );
    score += matchingTags.length * 2;
  }

  // Exact match bonus
  if (
    (item.title && item.title.toLowerCase() === searchLower) ||
    (item.name && item.name.toLowerCase() === searchLower)
  ) {
    score += 20;
  }

  return score;
}

