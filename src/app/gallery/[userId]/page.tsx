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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-800 font-semibold text-lg">Failed to load gallery</p>
          <p className="text-gray-600 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3">Personal Gallery</h1>
          <p className="text-lg text-gray-600 mb-4">
            Your avatars and drops collection
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white px-4 py-2 rounded-xl shadow-md border border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Total Items</span>
              <p className="text-2xl font-bold text-gray-900">{gallery.stats.total}</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-xl shadow-md border border-blue-200">
              <span className="text-sm text-blue-600 font-medium">Avatars</span>
              <p className="text-2xl font-bold text-blue-700">{gallery.stats.avatars}</p>
            </div>
            <div className="bg-purple-50 px-4 py-2 rounded-xl shadow-md border border-purple-200">
              <span className="text-sm text-purple-600 font-medium">Drops</span>
              <p className="text-2xl font-bold text-purple-700">{gallery.stats.drops}</p>
            </div>
          </div>
        </div>

        {gallery.items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-lg">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 font-semibold text-lg mb-2">Your gallery is empty</p>
            <p className="text-sm text-gray-500 mb-6">
              Create avatars and drops to see them here
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/avatars/create"
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                Create Avatar
              </a>
              <a
                href="/drops/create"
                className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                Create Drop
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gallery.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-2"
              >
                {item.imageUrl ? (
                  <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">No image</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        item.type === 'avatar'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {item.type === 'avatar' ? 'Avatar' : 'Drop'}
                    </span>
                    {item.type === 'drop' && item.stockAvailable !== undefined && (
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {item.stockAvailable}/{item.stockLimit}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base mb-2 text-gray-900 line-clamp-2 min-h-[2.5rem]">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  {item.type === 'drop' && item.generationStatus && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">
                        Status: <span className="text-gray-700">{item.generationStatus}</span>
                      </p>
                    </div>
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

