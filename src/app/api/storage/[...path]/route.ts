/**
 * Next.js API Route for serving local storage files
 * Dynamic route to serve images and other files from local storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { StorageService } from '../../../../lib/server/infrastructure/storage/storageService';
import logger from '../../../../lib/server/shared/utils/logger';

/**
 * GET /api/storage/[...path]
 * Serve files from local storage
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
): Promise<NextResponse> {
  try {
    const filePath = params.path.join('/');

    // Construct full path to requested file
    const fullPath = path.join(StorageService.STORAGE_BASE_DIR, filePath);

    // Basic security check - ensure path is within storage directory
    const storageDir = path.resolve(StorageService.STORAGE_BASE_DIR);
    const resolvedPath = path.resolve(fullPath);

    if (!resolvedPath.startsWith(storageDir)) {
      logger.warn('Security violation - path traversal attempt', {
        requestedPath: filePath,
        resolvedPath,
        storageDir,
      });
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists and get stats
    let stats;
    try {
      stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        return new NextResponse('Not Found', { status: 404 });
      }
    } catch (error) {
      logger.debug('File not found', { filePath, fullPath });
      return new NextResponse('Not Found', { status: 404 });
    }

    // Read file
    const fileBuffer = await StorageService.readFileAsBuffer(fullPath);

    // Determine content type based on file extension
    const extension = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (extension) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      default:
        // For unknown types, let browser figure it out
        break;
    }

    logger.debug('Serving storage file', {
      filePath,
      fullPath,
      contentType,
      sizeBytes: fileBuffer.length,
    });

    // Return file with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    headers.set('ETag', `"${stats.mtime.getTime()}"`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    logger.error('Error serving storage file', {
      error: error.message,
      params,
    });

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
