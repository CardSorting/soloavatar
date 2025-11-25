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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">Create Avatar</h1>
          <p className="text-gray-600 text-lg">Transform your images with AI-powered style transformations</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <label className="block mb-4 text-lg font-bold text-gray-900">Upload Image *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors duration-200">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
              disabled={loading}
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-gray-600 font-medium">Click to upload or drag and drop</span>
              <span className="text-sm text-gray-400 mt-2">PNG, JPG, GIF up to 10MB</span>
            </label>
          </div>
          {selectedImage && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-w-full sm:max-w-xs rounded-xl border-2 border-gray-200 shadow-md"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <label className="block mb-6 text-lg font-bold text-gray-900">Select Style *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {ART_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setSelectedStyle(style.id);
                  setCustomStyle('');
                }}
                disabled={loading}
                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 transform hover:scale-105 ${
                  selectedStyle === style.id
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`w-10 h-10 rounded-lg ${style.previewColor} mb-3 shadow-sm`}></div>
                <div className="font-bold text-sm text-gray-900 mb-1">{style.name}</div>
                <div className="text-xs text-gray-600 leading-tight">{style.description}</div>
              </button>
            ))}
          </div>
          <div className="pt-6 border-t border-gray-200">
            <label className="block mb-3 text-sm font-semibold text-gray-700">Or enter custom style:</label>
            <input
              type="text"
              value={customStyle}
              onChange={(e) => {
                setCustomStyle(e.target.value);
                setSelectedStyle('');
              }}
              placeholder="e.g., steampunk, minimalist, abstract..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={loading}
            />
          </div>
        </div>

        {status === 'processing' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
              <div>
                <p className="font-bold text-lg text-gray-900">Generating your avatar...</p>
                <p className="text-sm text-gray-600 mt-1">This may take a minute or two. Please wait...</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 font-bold text-lg">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && resultImageUrl && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold text-xl text-green-800">Avatar Generated Successfully!</p>
            </div>
            <div className="mb-6 flex justify-center">
              <div className="relative inline-block">
                <img
                  src={resultImageUrl}
                  alt="Generated Avatar"
                  className="max-w-full sm:max-w-md rounded-2xl border-4 border-green-300 shadow-2xl"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/gallery/single-user')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-800 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transform hover:scale-105 transition-all duration-200"
              >
                Create Another
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedImage || (!selectedStyle && !customStyle)}
          className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Generating...
            </span>
          ) : (
            'Generate Avatar'
          )}
        </button>
      </div>
    </div>
  );
}

