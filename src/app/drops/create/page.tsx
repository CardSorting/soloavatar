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
  const [userId, setUserId] = useState('');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stockLimit, setStockLimit] = useState(10);
  const [collectionName, setCollectionName] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserAvatars();
    }
  }, [userId]);

  const fetchUserAvatars = async () => {
    try {
      const response = await fetch(`/api/avatars/user/${userId}`);
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
    if (!selectedAvatarId || !title || !userId) {
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
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Drop created successfully!');
        router.push(`/gallery/${userId}`);
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create Instant Drop</h1>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <label className="block mb-2 font-semibold">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your user ID"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {userId && (
          <>
            <div className="bg-white rounded-lg border p-6 mb-6">
              <label className="block mb-2 font-semibold">Select Base Avatar *</label>
              {avatars.length === 0 ? (
                <p className="text-gray-500">No completed avatars found. Create an avatar first.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {avatars.map((avatar) => (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                        selectedAvatarId === avatar.id
                          ? 'border-blue-500'
                          : 'border-gray-200'
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

            <div className="bg-white rounded-lg border p-6 mb-6">
              <label className="block mb-2 font-semibold">Drop Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Drop"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="bg-white rounded-lg border p-6 mb-6">
              <label className="block mb-2 font-semibold">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your drop..."
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
            </div>

            <div className="bg-white rounded-lg border p-6 mb-6">
              <label className="block mb-2 font-semibold">Stock Limit *</label>
              <input
                type="number"
                value={stockLimit}
                onChange={(e) => setStockLimit(parseInt(e.target.value) || 10)}
                min={1}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="bg-white rounded-lg border p-6 mb-6">
              <label className="block mb-2 font-semibold">Collection Name (optional)</label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="My Collection"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <button
              onClick={handleCreateDrop}
              disabled={loading || !selectedAvatarId || !title}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Drop Instantly'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

