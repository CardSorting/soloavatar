import { NextRequest, NextResponse } from 'next/server';
import { AvatarService } from '@/lib/server/domains/gemini/services/avatarService';
import logger from '@/lib/server/shared/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const avatars = await AvatarService.getUserAvatars(params.userId);
    return NextResponse.json(avatars);
  } catch (error: any) {
    logger.error('Get user avatars API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get user avatars' },
      { status: 500 }
    );
  }
}

