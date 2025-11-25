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
        // Only show completed avatars
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
        const data = await response.json();
        alert('Drop created successfully!');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">Create Instant Drop</h1>
          <p className="text-gray-600 text-lg">Create a drop from your avatars - ready to claim instantly</p>
        </div>

        <>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
              <label className="block mb-4 text-lg font-bold text-gray-900">Select Base Avatar *</label>
              {avatars.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">No completed avatars found</p>
                  <p className="text-sm text-gray-400 mt-2">Create an avatar first to use as a base</p>
                  <a
                    href="/avatars/create"
                    className="inline-block mt-4 px-4 py-2 text-blue-600 font-semibold hover:text-blue-700"
                  >
                    Create Avatar →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {avatars.map((avatar) => (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all duration-200 transform hover:scale-105 ${
                        selectedAvatarId === avatar.id
                          ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {avatar.outputImageUrl && (
                        <img
                          src={avatar.outputImageUrl}
                          alt="Avatar"
                          className="w-full aspect-square object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
              <label className="block mb-3 text-lg font-bold text-gray-900">Drop Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Drop"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
              <label className="block mb-3 text-lg font-bold text-gray-900">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your drop..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                <label className="block mb-3 text-lg font-bold text-gray-900">Stock Limit *</label>
                <input
                  type="number"
                  value={stockLimit}
                  onChange={(e) => setStockLimit(parseInt(e.target.value) || 10)}
                  min={1}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-sm text-gray-500 mt-2">Maximum number of items available</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                <label className="block mb-3 text-lg font-bold text-gray-900">Collection Name</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="My Collection"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-sm text-gray-500 mt-2">Optional collection grouping</p>
              </div>
            </div>

            <button
              onClick={handleCreateDrop}
              disabled={loading || !selectedAvatarId || !title}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating...
                </span>
              ) : (
                'Create Drop Instantly'
              )}
            </button>
        </>
      </div>
    </div>
  );
}

