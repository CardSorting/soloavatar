import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/lib/server/domains/collections/services/collectionService';
import { BadRequestError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

/**
 * GET /api/collections
 * List all collections (single-user system)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    let collections;
    if (query) {
      collections = await CollectionService.searchCollections(query);
    } else {
      collections = await CollectionService.getCollections();
    }

    return NextResponse.json(collections);
  } catch (error: any) {
    logger.error('Get collections API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get collections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections
 * Create a new collection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, coverImageUrl } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    const collection = await CollectionService.createCollection({
      name,
      description,
      color,
      coverImageUrl,
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error: any) {
    logger.error('Create collection API error', { error: error.message });
    
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}

