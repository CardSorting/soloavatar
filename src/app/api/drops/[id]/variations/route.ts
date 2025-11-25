import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/infrastructure/database/prisma';
import { BadRequestError, NotFoundError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

/**
 * GET /api/drops/[id]/variations
 * Get generated variations for a drop
 * Query params: rarity, assigned (true/false), limit, offset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const rarity = searchParams.get('rarity');
    const assigned = searchParams.get('assigned'); // 'true' or 'false'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Build where clause
    const where: any = {
      listingId: params.id,
    };

    if (rarity) {
      where.rarity = rarity;
    }

    if (assigned === 'true') {
      where.assignedToTokenId = { not: null };
    } else if (assigned === 'false') {
      where.assignedToTokenId = null;
    }

    // Get variations
    const variations = await prisma.dropGeneratedAvatar.findMany({
      where,
      orderBy: [
        { tokenNumber: 'asc' },
      ],
      take: limit,
      skip: offset,
      include: {
        assignedToken: {
          select: {
            id: true,
            ownerId: true,
            tokenNumber: true,
            acquiredAt: true,
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.dropGeneratedAvatar.count({ where });

    return NextResponse.json({
      variations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    logger.error('Get drop variations API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get variations' },
      { status: 500 }
    );
  }
}

