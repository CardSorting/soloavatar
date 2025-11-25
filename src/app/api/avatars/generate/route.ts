import { NextRequest, NextResponse } from 'next/server';
import { AvatarService } from '@/lib/server/domains/gemini/services/avatarService';
import { BadRequestError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, stylePrompt, userId } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    if (!stylePrompt) {
      return NextResponse.json(
        { error: 'Style prompt is required' },
        { status: 400 }
      );
    }

    // For simplicity, userId can be provided or default to 'anonymous'
    const finalUserId = userId || 'anonymous';

    const outputImageUrl = await AvatarService.generateAvatar(
      imageBase64,
      stylePrompt,
      finalUserId
    );

    return NextResponse.json({
      success: true,
      imageUrl: outputImageUrl,
    });
  } catch (error: any) {
    logger.error('Avatar generation API error', { error: error.message });
    
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate avatar' },
      { status: 500 }
    );
  }
}

