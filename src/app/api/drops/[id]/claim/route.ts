import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/infrastructure/database/prisma';
import { BadRequestError, NotFoundError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

/**
 * POST /api/drops/[id]/claim
 * Claim/assign a variation token (single-user system)
 * Body: { tokenNumber: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { tokenNumber } = body;

    if (tokenNumber === undefined || typeof tokenNumber !== 'number') {
      return NextResponse.json(
        { error: 'tokenNumber is required and must be a number' },
        { status: 400 }
      );
    }

    // Verify drop exists
    const drop = await prisma.dropListing.findUnique({
      where: { id: params.id },
    });

    if (!drop || drop.deletedAt) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    // Check if variation exists and is unassigned
    const variation = await prisma.dropGeneratedAvatar.findUnique({
      where: {
        listingId_tokenNumber: {
          listingId: params.id,
          tokenNumber,
        },
      },
    });

    if (!variation) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      );
    }

    if (variation.assignedToTokenId) {
      return NextResponse.json(
        { error: 'Variation already assigned' },
        { status: 400 }
      );
    }

    // Check stock availability
    if (drop.stockAvailable <= 0) {
      return NextResponse.json(
        { error: 'No stock available' },
        { status: 400 }
      );
    }

    // Single-user system - use default user ID
    const userId = 'single-user';

    // Check if ownership token already exists for this token number
    const existingOwnership = await prisma.dropOwnership.findUnique({
      where: {
        listingId_tokenNumber: {
          listingId: params.id,
          tokenNumber,
        },
      },
    });

    if (existingOwnership) {
      return NextResponse.json(
        { error: 'Token number already claimed' },
        { status: 400 }
      );
    }

    // Create ownership token
    const ownership = await prisma.dropOwnership.create({
      data: {
        listingId: params.id,
        ownerId: userId,
        tokenNumber,
      },
    });

    // Assign variation to ownership token
    await prisma.dropGeneratedAvatar.update({
      where: { id: variation.id },
      data: {
        assignedToTokenId: ownership.id,
      },
    });

    // Decrease stock
    await prisma.dropListing.update({
      where: { id: params.id },
      data: {
        stockAvailable: {
          decrement: 1,
        },
      },
    });

    logger.info('Variation claimed', {
      dropId: params.id,
      tokenNumber,
      ownershipId: ownership.id,
    });

    return NextResponse.json({
      success: true,
      ownership: {
        id: ownership.id,
        tokenNumber: ownership.tokenNumber,
        acquiredAt: ownership.acquiredAt,
      },
      variation: {
        id: variation.id,
        traits: variation.traits,
        rarity: variation.rarity,
        avatarImageUrl: variation.avatarImageUrl,
      },
    });
  } catch (error: any) {
    logger.error('Claim variation API error', { error: error.message });
    
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

    // Handle unique constraint violation (token already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Token number already exists for this drop' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to claim variation' },
      { status: 500 }
    );
  }
}

