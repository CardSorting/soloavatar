import { NextRequest, NextResponse } from 'next/server';
import { CollectionService } from '@/lib/server/domains/collections/services/collectionService';
import { BadRequestError, NotFoundError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

/**
 * POST /api/collections/[id]/items
 * Add items (avatars) to collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { avatarIds } = body;

    if (!avatarIds || !Array.isArray(avatarIds)) {
      return NextResponse.json(
        { error: 'avatarIds array is required' },
        { status: 400 }
      );
    }

    if (avatarIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one avatar ID is required' },
        { status: 400 }
      );
    }

    await CollectionService.addItemsToCollection(params.id, {
      avatarIds,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Add items to collection API error', { error: error.message });
    
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
      { error: 'Failed to add items to collection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collections/[id]/items
 * Remove items (avatars) from collection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { avatarIds } = body;

    if (!avatarIds || !Array.isArray(avatarIds)) {
      return NextResponse.json(
        { error: 'avatarIds array is required' },
        { status: 400 }
      );
    }

    if (avatarIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one avatar ID is required' },
        { status: 400 }
      );
    }

    await CollectionService.removeItemsFromCollection(params.id, {
      avatarIds,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Remove items from collection API error', { error: error.message });
    
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
      { error: 'Failed to remove items from collection' },
      { status: 500 }
    );
  }
}

