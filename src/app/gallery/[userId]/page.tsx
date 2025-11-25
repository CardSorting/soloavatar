'use client';

import { useEffect, useMemo, useState } from 'react';
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

const filters = [
  { key: 'all', label: 'Everything' },
  { key: 'avatar', label: 'Avatars' },
  { key: 'drop', label: 'Drops' },
];

export default function GalleryPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'avatar' | 'drop'>('all');

  useEffect(() => {
    const fetchGallery = async () => {
      try {
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

  const filteredItems = useMemo(() => {
    if (!gallery) return [];
    if (activeFilter === 'all') return gallery.items;
    return gallery.items.filter((item) => item.type === activeFilter);
  }, [gallery, activeFilter]);

  if (loading) {
    return (
      <div className="desktop-window h-[60vh] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-sky-300 mx-auto" />
          <p className="text-white/70 font-medium">Loading gallery…</p>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="desktop-window h-[60vh] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <svg className="w-12 h-12 text-rose-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-lg">Failed to load gallery</p>
          <p className="text-white/70 text-sm">Please refresh and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="desktop-window">
        <div className="desktop-titlebar">
          <span>Library</span>
          <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-white/35">Desktop archive</span>
        </div>
        <div className="desktop-window__content space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60 mb-3">Step · optional drop finale</p>
              <h1 className="text-4xl font-black">Everything you’ve created lives in this window.</h1>
              <p className="text-white/70 mt-3">
                Track generated avatars, optional drops, and their statuses without leaving the personal desktop space.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="desktop-pane">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Total</p>
                <p className="text-3xl font-bold">{gallery.stats.total}</p>
                <p className="text-xs text-white/60">Items</p>
              </div>
              <div className="desktop-pane">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Avatars</p>
                <p className="text-3xl font-bold text-sky-200">{gallery.stats.avatars}</p>
              </div>
              <div className="desktop-pane">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Drops</p>
                <p className="text-3xl font-bold text-purple-200">{gallery.stats.drops}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter.key
                    ? 'border-white/40 bg-white/15 text-white'
                    : 'border-white/10 text-white/70 hover:border-white/25'
                }`}
              >
                {filter.label}
              </button>
            ))}
            <div className="ml-auto flex gap-3">
              <a
                href="/avatars/create"
                className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
              >
                New avatar
              </a>
              <a
                href="/drops/create"
                className="rounded-2xl border border-emerald-200/50 px-4 py-2 text-sm font-semibold text-emerald-100 hover:border-emerald-200/80"
              >
                Optional drop
              </a>
            </div>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        gallery.items.length === 0 ? (
          // Empty state - no items at all
          <div className="desktop-window">
            <div className="desktop-window__content text-center py-16 space-y-8">
              <div className="space-y-4">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-sky-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Your gallery awaits</h2>
                  <p className="text-white/70 max-w-sm mx-auto">
                    Create your first avatar or drop to get started. It's time to bring your ideas to life.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/avatars/create"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Avatar
                </a>
                <a
                  href="/drops/create"
                  className="inline-flex items-center gap-3 border border-emerald-300/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-100 font-semibold px-6 py-3 rounded-2xl transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Optional Drop
                </a>
              </div>
            </div>
          </div>
        ) : (
          // Filtered out but has items
          <div className="desktop-window">
            <div className="desktop-window__content text-center py-16 space-y-3">
              <p className="text-lg font-semibold">No items match this view</p>
              <p className="text-white/70">Switch filters or create something new.</p>
            </div>
          </div>
        )
      ) : (
        <div className="desktop-window">
          <div className="desktop-titlebar">
            <span>Library grid</span>
            <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-white/35">Avatar-first</span>
          </div>
          <div className="desktop-window__content">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="desktop-pane p-0 overflow-hidden">
                  {item.imageUrl ? (
                    <div className="relative aspect-square">
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center text-white/40">No image</div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          item.type === 'avatar'
                            ? 'bg-sky-500/15 text-sky-100 border border-sky-300/30'
                            : 'bg-purple-500/15 text-purple-100 border border-purple-300/30'
                        }`}
                      >
                        {item.type === 'avatar' ? 'Avatar' : 'Drop'}
                      </span>
                      {item.type === 'drop' && item.stockAvailable !== undefined && (
                        <span className="text-xs font-semibold text-white/80 bg-white/10 px-2 py-1 rounded-full">
                          {item.stockAvailable}/{item.stockLimit}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    {item.type === 'drop' && item.generationStatus && (
                      <p className="text-xs text-white/60">
                        Status: <span className="text-white">{item.generationStatus}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
