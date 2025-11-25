import { NextRequest, NextResponse } from 'next/server';
import { AvatarService } from '@/lib/server/domains/gemini/services/avatarService';
import { BadRequestError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

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

