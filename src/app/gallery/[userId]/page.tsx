'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface GalleryItem {
  type: 'avatar' | 'drop';
  id: string;
  imageUrl: string | null;
  createdAt: string;
  title: string;
  status?: string;
  stockAvailable?: number;
  stockLimit?: number;
  generationStatus?: string;
}

interface GalleryData {
  userId: string;
  items: GalleryItem[];
  stats: {
    avatars: number;
    drops: number;
    total: number;
  };
}

export default function GalleryPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        // Single user system - use 'single-user' as default
        const galleryUserId = userId || 'single-user';
        const response = await fetch(`/api/gallery/${galleryUserId}`);
        if (response.ok) {
          const data = await response.json();
          setGallery(data);
        }
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Loading gallery...</div>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">Failed to load gallery</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Personal Gallery</h1>
          <p className="text-gray-600">
            Your avatars and drops ({gallery.stats.total} items)
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <span className="text-gray-600">
              {gallery.stats.avatars} Avatars
            </span>
            <span className="text-gray-600">
              {gallery.stats.drops} Drops
            </span>
          </div>
        </div>

        {gallery.items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">Your gallery is empty</p>
            <p className="text-sm text-gray-400 mt-2">
              Create avatars and drops to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition"
              >
                {item.imageUrl ? (
                  <div className="aspect-square relative bg-gray-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.type === 'avatar'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {item.type === 'avatar' ? 'Avatar' : 'Drop'}
                    </span>
                    {item.type === 'drop' && item.stockAvailable !== undefined && (
                      <span className="text-xs text-gray-500">
                        {item.stockAvailable}/{item.stockLimit}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  {item.type === 'drop' && item.generationStatus && (
                    <p className="text-xs text-gray-400 mt-1">
                      Status: {item.generationStatus}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

