'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ART_STYLES } from '@/constants/artStyles';

export default function CreateAvatarPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [customStyle, setCustomStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }

    const stylePrompt = selectedStyle 
      ? ART_STYLES.find(s => s.id === selectedStyle)?.promptModifier || customStyle
      : customStyle;

    if (!stylePrompt) {
      alert('Please select a style or enter a custom style');
      return;
    }

    setLoading(true);
    setStatus('processing');
    setError(null);
    setResultImageUrl(null);

    try {
      const response = await fetch('/api/avatars/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          stylePrompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate avatar');
      }

      const data = await response.json();
      setRequestId(data.requestId);

      // Poll for status
      await pollAvatarStatus(data.requestId);
    } catch (err: any) {
      setError(err.message || 'Failed to generate avatar');
      setStatus('failed');
      setLoading(false);
    }
  };

  const pollAvatarStatus = async (avatarId: string) => {
    const maxAttempts = 60; // 2 minutes max
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/avatars/${avatarId}`);
        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();
        
        if (data.status === 'completed' && data.outputImageUrl) {
          setResultImageUrl(data.outputImageUrl);
          setStatus('completed');
          setLoading(false);
          return;
        }

        if (data.status === 'failed') {
          setError(data.errorMessage || 'Avatar generation failed');
          setStatus('failed');
          setLoading(false);
          return;
        }

        // Still processing, check again
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000); // Check every 2 seconds
        } else {
          setError('Generation timed out. Please check the gallery later.');
          setStatus('failed');
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check status');
        setStatus('failed');
        setLoading(false);
      }
    };

    checkStatus();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create Avatar</h1>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <label className="block mb-2 font-semibold">Upload Image *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="w-full px-4 py-2 border rounded-lg"
            disabled={loading}
          />
          {selectedImage && (
            <div className="mt-4">
              <img
                src={selectedImage}
                alt="Selected"
                className="max-w-xs rounded-lg border"
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <label className="block mb-4 font-semibold">Select Style *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {ART_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setSelectedStyle(style.id);
                  setCustomStyle('');
                }}
                disabled={loading}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  selectedStyle === style.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-8 h-8 rounded ${style.previewColor} mb-2`}></div>
                <div className="font-semibold text-sm">{style.name}</div>
                <div className="text-xs text-gray-500 mt-1">{style.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium">Or enter custom style:</label>
            <input
              type="text"
              value={customStyle}
              onChange={(e) => {
                setCustomStyle(e.target.value);
                setSelectedStyle('');
              }}
              placeholder="e.g., steampunk, minimalist, abstract..."
              className="w-full px-4 py-2 border rounded-lg"
              disabled={loading}
            />
          </div>
        </div>

        {status === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-semibold">Generating your avatar...</p>
                <p className="text-sm text-gray-600">This may take a minute or two</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {status === 'completed' && resultImageUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="font-semibold text-green-800 mb-4">Avatar Generated Successfully!</p>
            <div className="mb-4">
              <img
                src={resultImageUrl}
                alt="Generated Avatar"
                className="max-w-md rounded-lg border-2 border-green-300"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/gallery/single-user')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                View in Gallery
              </button>
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setSelectedStyle('');
                  setCustomStyle('');
                  setStatus('idle');
                  setResultImageUrl(null);
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Create Another
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedImage || (!selectedStyle && !customStyle)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Avatar'}
        </button>
      </div>
    </div>
  );
}

