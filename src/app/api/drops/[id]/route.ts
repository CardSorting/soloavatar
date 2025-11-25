import { NextRequest, NextResponse } from 'next/server';
import { DropService } from '@/lib/server/domains/drops/services/dropService';
import { BadRequestError } from '@/lib/server/shared/errors';
import logger from '@/lib/server/shared/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drop = await DropService.getDropById(params.id);
    
    if (!drop) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(drop);
  } catch (error: any) {
    logger.error('Get drop API error', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to get drop' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Single user system - no userId needed
    await DropService.deleteDrop(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete drop API error', { error: error.message });
    
    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete drop' },
      { status: 500 }
    );
  }
}

