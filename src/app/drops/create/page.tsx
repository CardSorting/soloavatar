'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Avatar {
  id: string;
  outputImageUrl: string | null;
  stylePrompt: string;
  status: string;
  createdAt: string;
}

const phases = [
  { label: 'Source', detail: 'Pick a generated avatar' },
  { label: 'Story', detail: 'Craft a title and purpose' },
  { label: 'Supply', detail: 'Set stock and collection' },
  { label: 'Drop', detail: 'Launch + share instantly' },
];

export default function CreateDropPage() {
  const router = useRouter();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stockLimit, setStockLimit] = useState(10);
  const [collectionName, setCollectionName] = useState('');

  useEffect(() => {
    fetchUserAvatars();
  }, []);

  const fetchUserAvatars = async () => {
    try {
      const response = await fetch('/api/avatars/user/single-user');
      if (response.ok) {
        const data = await response.json();
        const completed = data.filter((a: Avatar) => a.status === 'completed' && a.outputImageUrl);
        setAvatars(completed);
      }
    } catch (error) {
      console.error('Failed to fetch avatars:', error);
    }
  };

  const handleCreateDrop = async () => {
    if (!selectedAvatarId || !title) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseAvatarId: selectedAvatarId,
          title,
          description: description || undefined,
          stockLimit,
          collectionName: collectionName || undefined,
        }),
      });

      if (response.ok) {
        await response.json();
        router.push('/gallery/single-user');
      } else {
        const error = await response.json();
        alert(`Failed to create drop: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create drop:', error);
      alert('Failed to create drop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="desktop-window">
        <div className="desktop-titlebar">
          <span>Drop drawer</span>
          <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-emerald-200">Optional tool</span>
        </div>
        <div className="desktop-window__content flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <h1 className="text-4xl font-black">Package avatars into drops only when it serves the story.</h1>
            <p className="text-white/70 max-w-2xl">
              Avatars live happily in your Library until you open this drawer. Build scarcity, add a little lore, and
              share once you’re ready—closing the drawer keeps things private.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/gallery/single-user')}
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:border-white/40 transition"
              >
                Skip for now · go to Library
              </button>
              <a href="/avatars/create" className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:text-white">
                Need another avatar?
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-[320px]">
            <div className="desktop-pane">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Available avatars</p>
              <p className="text-3xl font-bold">{avatars.length}</p>
              <p className="text-xs text-white/60">Completed & ready</p>
            </div>
            <div className="desktop-pane">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Typical stock</p>
              <p className="text-3xl font-bold">25</p>
              <p className="text-xs text-white/60">Median release</p>
            </div>
          </div>
        </div>
      </div>

      <div className="desktop-window">
        <div className="desktop-titlebar">
          <span>Journey map</span>
          <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-white/35">Optional finale</span>
        </div>
        <div className="desktop-window__content grid gap-4 md:grid-cols-4">
          {phases.map((phase, index) => (
            <div key={phase.label} className="desktop-pane">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl border border-white/15 flex items-center justify-center font-semibold">
                  0{index + 1}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{phase.label}</p>
                  <p className="text-sm text-white/80">{phase.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="desktop-window">
            <div className="desktop-titlebar">
              <span>Source avatar</span>
              <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-white/40">
                {selectedAvatarId ? 'Selected' : 'Required'}
              </span>
            </div>
            <div className="desktop-window__content">
              {avatars.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-white/15 rounded-2xl">
                  <p className="font-semibold">No completed avatars yet</p>
                  <p className="text-sm text-white/60 mt-1">Create an avatar first to use as a drop base.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {avatars.map((avatar) => (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={`relative rounded-2xl overflow-hidden border transition ${
                        selectedAvatarId === avatar.id
                          ? 'border-purple-300 shadow-[0_15px_50px_rgba(32,3,43,0.9)]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {avatar.outputImageUrl && (
                        <img src={avatar.outputImageUrl} alt="Avatar" className="aspect-square object-cover w-full" />
                      )}
                      {selectedAvatarId === avatar.id && (
                        <div className="absolute inset-0 border-2 border-white/70 pointer-events-none rounded-2xl" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="desktop-window">
            <div className="desktop-titlebar">
              <span>Story & supply</span>
            </div>
            <div className="desktop-window__content space-y-5">
              <div>
                <label className="text-sm font-semibold text-white">Drop title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Midnight Neon Guardians"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-300/70"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell collectors what makes this drop special..."
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-300/70"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-white">Stock limit *</label>
                  <input
                    type="number"
                    value={stockLimit}
                    onChange={(e) => setStockLimit(parseInt(e.target.value) || 1)}
                    min={1}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:border-purple-300/70"
                  />
                  <p className="text-xs text-white/60 mt-2">Keep it scarce to heighten demand.</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Collection name</label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="Neon Heist Vol. 1"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-300/70"
                  />
                  <p className="text-xs text-white/60 mt-2">Optional grouping for your drops.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="desktop-window">
            <div className="desktop-window__content space-y-4">
              <button
                onClick={handleCreateDrop}
                disabled={loading || !selectedAvatarId || !title}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-6 py-4 font-semibold text-lg text-white shadow-[0_20px_60px_rgba(32,4,35,0.7)] transition hover:border-white/40 disabled:opacity-40"
              >
                {loading ? 'Publishing drop...' : 'Publish drop'}
              </button>
              <p className="text-xs text-white/50 text-center">
                Not ready? Close the drawer—your avatars stay available in the Library.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="desktop-window">
            <div className="desktop-titlebar">
              <span>Drop summary</span>
            </div>
            <div className="desktop-window__content space-y-3 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Avatar</span>
                <span>{selectedAvatarId ? `#${selectedAvatarId.slice(0, 6)}` : 'Not selected'}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Title</span>
                <span className="text-white font-semibold">{title || 'Untitled'}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Stock</span>
                <span className="text-white font-semibold">{stockLimit}</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Collection</span>
                <span className="text-white font-semibold">{collectionName || 'Single drop'}</span>
              </div>
            </div>
          </div>

          <div className="desktop-window">
            <div className="desktop-titlebar">
              <span>Launch checklist</span>
            </div>
            <div className="desktop-window__content space-y-3 text-sm text-white/80">
              <p>✔ Pick an avatar with a finished style.</p>
              <p>✔ Tell a story in 1–2 sentences.</p>
              <p>✔ Keep stock between 10–40 for scarcity.</p>
              <p>✔ Share the gallery link post-launch.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

