import { NextRequest, NextResponse } from 'next/server';
import { AvatarService } from '@/lib/server/domains/gemini/services/avatarService';
import { AvatarMetadataService } from '@/lib/server/domains/gemini/services/avatarMetadataService';
import { BadRequestError, NotFoundError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

/**
 * GET /api/avatars/[id]
 * Get avatar by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const avatar = await AvatarService.getAvatarById(params.id);
    return NextResponse.json(avatar);
  } catch (error: any) {
    logger.error('Get avatar API error', { error: error.message });
    
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get avatar' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/avatars/[id]
 * Update avatar metadata (tags, favorite, rating, notes, collectionId)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { collectionId, tags, rating, notes, favorite } = body;

    // Validate that at least one field is provided
    if (
      collectionId === undefined &&
      tags === undefined &&
      rating === undefined &&
      notes === undefined &&
      favorite === undefined
    ) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    const avatar = await AvatarMetadataService.updateAvatarMetadata(params.id, {
      collectionId: collectionId === null ? null : collectionId,
      tags,
      rating: rating === null ? null : rating,
      notes: notes === null ? null : notes,
      favorite,
    });

    return NextResponse.json(avatar);
  } catch (error: any) {
    logger.error('Update avatar metadata API error', { error: error.message });
    
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
      { error: 'Failed to update avatar metadata' },
      { status: 500 }
    );
  }
}

