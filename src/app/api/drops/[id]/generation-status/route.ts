import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/infrastructure/database/prisma';
import { NotFoundError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

/**
 * GET /api/drops/[id]/generation-status
 * Get generation status and progress for a drop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drop = await prisma.dropListing.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        generationStatus: true,
        generationProgress: true,
        stockLimit: true,
        _count: {
          select: {
            generatedAvatars: true,
          },
        },
      },
    });

    if (!drop || drop.deletedAt) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    // Get counts by rarity
    const rarityCounts = await prisma.dropGeneratedAvatar.groupBy({
      by: ['rarity'],
      where: {
        listingId: params.id,
      },
      _count: {
        rarity: true,
      },
    });

    const rarityDistribution = rarityCounts.reduce((acc, item) => {
      acc[item.rarity] = item._count.rarity;
      return acc;
    }, {} as Record<string, number>);

    // Get assigned vs unassigned counts
    const assignedCount = await prisma.dropGeneratedAvatar.count({
      where: {
        listingId: params.id,
        assignedToTokenId: { not: null },
      },
    });

    const unassignedCount = await prisma.dropGeneratedAvatar.count({
      where: {
        listingId: params.id,
        assignedToTokenId: null,
      },
    });

    return NextResponse.json({
      dropId: drop.id,
      generationStatus: drop.generationStatus,
      generationProgress: drop.generationProgress,
      totalVariations: drop._count.generatedAvatars,
      stockLimit: drop.stockLimit,
      assignedCount,
      unassignedCount,
      rarityDistribution,
    });
  } catch (error: any) {
    logger.error('Get generation status API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get generation status' },
      { status: 500 }
    );
  }
}

