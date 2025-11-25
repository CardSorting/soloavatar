import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/lib/server/domains/collections/services/collectionService';
import { BadRequestError, NotFoundError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

/**
 * GET /api/collections/[id]
 * Get collection by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collection = await CollectionService.getCollectionById(params.id);
    
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error: any) {
    logger.error('Get collection API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get collection' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/collections/[id]
 * Update collection
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, color, coverImageUrl } = body;

    const collection = await CollectionService.updateCollection(params.id, {
      name,
      description,
      color,
      coverImageUrl,
    });

    return NextResponse.json(collection);
  } catch (error: any) {
    logger.error('Update collection API error', { error: error.message });
    
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collections/[id]
 * Delete collection (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await CollectionService.deleteCollection(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete collection API error', { error: error.message });
    
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

