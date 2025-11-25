'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleViewGallery = () => {
    router.push('/gallery/single-user');
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Personal Avatar & Drop System</h1>
        <p className="text-lg text-gray-600 mb-8">
          Generate styled avatars and create instant drops for your personal collection
        </p>
        
        <div className="mb-8 p-6 bg-white rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">View Your Gallery</h2>
          <button
            onClick={handleViewGallery}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Gallery
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/avatars/create"
            className="p-6 bg-white border rounded-lg hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-semibold mb-2">Create Avatar</h2>
            <p className="text-gray-600">
              Generate styled avatars from your images using AI
            </p>
          </a>
          
          <a
            href="/drops/create"
            className="p-6 bg-white border rounded-lg hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-semibold mb-2">Create Drop</h2>
            <p className="text-gray-600">
              Create instant drops from your avatars - no scheduling needed
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}

