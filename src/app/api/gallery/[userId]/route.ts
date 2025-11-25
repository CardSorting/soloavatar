import { NextRequest, NextResponse } from 'next/server';
import { AvatarService } from '@/lib/server/domains/gemini/services/avatarService';
import { DropService } from '@/lib/server/domains/drops/services/dropService';
import logger from '@/lib/server/shared/utils/logger';

/**
 * Personal Gallery API
 * Returns both avatars and drops for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const [avatars, drops] = await Promise.all([
      AvatarService.getUserAvatars(params.userId),
      DropService.getUserDrops(params.userId),
    ]);

    // Combine and sort by creation date
    const gallery = [
      ...avatars.map((avatar: any) => ({
        type: 'avatar' as const,
        id: avatar.id,
        imageUrl: avatar.outputImageUrl,
        createdAt: avatar.createdAt,
        title: `Avatar - ${avatar.stylePrompt.substring(0, 30)}...`,
        status: avatar.status,
      })),
      ...drops.map((drop: any) => ({
        type: 'drop' as const,
        id: drop.id,
        imageUrl: drop.baseAvatar.outputImageUrl,
        createdAt: drop.createdAt,
        title: drop.title,
        stockAvailable: drop.stockAvailable,
        stockLimit: drop.stockLimit,
        generationStatus: drop.generationStatus,
      })),
    ].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      userId: params.userId,
      items: gallery,
      stats: {
        avatars: avatars.length,
        drops: drops.length,
        total: gallery.length,
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

