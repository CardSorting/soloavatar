'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ART_STYLES } from '@/constants/artStyles';

const timeline = [
  { label: 'Upload', detail: 'High-res portrait, clear lighting' },
  { label: 'Style', detail: 'Pick a preset or craft your prompt' },
  { label: 'Render', detail: 'We’ll queue, polish, and deliver' },
];

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
      ? ART_STYLES.find((s) => s.id === selectedStyle)?.promptModifier || customStyle
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
      await pollAvatarStatus(data.requestId);
    } catch (err: any) {
      setError(err.message || 'Failed to generate avatar');
      setStatus('failed');
      setLoading(false);
    }
  };

  const pollAvatarStatus = async (avatarId: string) => {
    const maxAttempts = 60;
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

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
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
    <section className="space-y-8">
      <div className="desktop-window">
        <div className="desktop-titlebar">
          <span>Avatar lab</span>
          <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-white/35">Core workspace</span>
        </div>
        <div className="desktop-window__content flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight">Upload, style, and render inside one window.</h1>
            <p className="text-white/70 text-lg max-w-2xl">
              Every avatar you generate lands in the Library instantly. The Drop Drawer stays an optional drawer—finish
              styling first, decide on scarcity later.
            </p>
          </div>
            <div className="grid grid-cols-2 gap-4 w-full lg:w-[320px]">
              <div className="desktop-pane text-sm space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Queue ETA</p>
                <p className="text-3xl font-semibold">45s</p>
                <p className="text-white/50 text-xs">Average render</p>
              </div>
              <div className="desktop-pane text-sm space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Success</p>
                <p className="text-3xl font-semibold">
                  <span className="status-indicator status-online">
                    <span className="text-emerald-100">98%</span>
                  </span>
                </p>
                <p className="text-white/50 text-xs">Completion rate</p>
              </div>
            </div>
        </div>
      </div>

      <div className="desktop-window">
        <div className="desktop-titlebar">
          <span>Timeline</span>
        </div>
        <div className="desktop-window__content grid gap-4 md:grid-cols-3">
          {timeline.map((step, index) => (
            <div key={step.label} className="desktop-pane">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl border border-white/15 flex items-center justify-center font-semibold">
                  0{index + 1}
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">{step.label}</p>
              </div>
              <p className="text-white/80 text-sm">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="desktop-window">
            <div className="desktop-titlebar">
              <span>Stage 1 — Upload</span>
              <span className="ml-auto text-[0.65rem] uppercase tracking-[0.3em] text-white/40">
                {selectedImage ? 'Ready' : 'Required'}
              </span>
            </div>
            <div className="desktop-window__content space-y-4">
              <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-sky-300/70 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={loading}
                />
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9m-2 1.1l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className="font-semibold">Drag & drop or browse</p>
                    <p className="text-sm text-white/60">PNG · JPG · WebP (max 10MB)</p>
                  </div>
                </label>
              </div>
              {selectedImage && (
                <div className="desktop-pane">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-2">Preview</p>
                  <img src={selectedImage} alt="Selected" className="rounded-2xl border border-white/10 w-full max-w-sm" />
                </div>
              )}
            </div>
          </section>

          <section className="desktop-window">
            <div className="desktop-titlebar">
              <span>Stage 2 — Style</span>
              <span className="ml-auto text-[0.65rem] uppercase tracking-[0.3em] text-white/40">
                {selectedStyle ? 'Preset' : customStyle ? 'Custom' : 'Awaiting'}
              </span>
            </div>
            <div className="desktop-window__content space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ART_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyle(style.id);
                      setCustomStyle('');
                    }}
                    disabled={loading}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedStyle === style.id
                        ? 'border-sky-300 bg-sky-500/20 shadow-[0_10px_30px_rgba(11,20,40,0.6)]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${style.previewColor} mb-3`} />
                    <p className="font-semibold text-sm">{style.name}</p>
                    <p className="text-xs text-white/60">{style.description}</p>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">Custom prompt</label>
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => {
                    setCustomStyle(e.target.value);
                    setSelectedStyle('');
                  }}
                  placeholder="Describe your own art direction..."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400/70"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {(status === 'processing' || error || (status === 'completed' && resultImageUrl)) && (
            <section className="desktop-window">
              <div className="desktop-titlebar">
                <span>Render status</span>
              </div>
              <div className="desktop-window__content space-y-4">
                {status === 'processing' && (
                  <div className="flex items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-sky-300" />
                    <div>
                      <p className="font-semibold">Generating your avatar...</p>
                      <p className="text-white/60 text-sm">The desktop client will notify you once complete.</p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4">
                    <p className="font-semibold text-red-200">Generation failed</p>
                    <p className="text-sm text-red-100/80 mt-1">{error}</p>
                  </div>
                )}
                {status === 'completed' && resultImageUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-semibold">Avatar ready!</p>
                    </div>
                    <img src={resultImageUrl} alt="Generated avatar" className="rounded-2xl border border-white/10 w-full max-w-sm" />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => router.push('/gallery/single-user')}
                        className="flex-1 btn-primary text-emerald-100 border-emerald-300/40 bg-emerald-400/10 hover:border-emerald-300/60"
                      >
                        View in Library
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
                        className="flex-1 btn-primary"
                      >
                        Reset flow
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="desktop-window">
            <div className="desktop-titlebar">
              <span>Studio log</span>
            </div>
            <div className="desktop-window__content space-y-4 text-sm">
              <div className="flex items-center justify-between text-white/70">
                <span>Request ID</span>
                <span className="font-mono text-white">{requestId || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>Status</span>
                <span className="font-semibold text-white">
                  {status === 'idle' && 'Awaiting'}
                  {status === 'processing' && 'Rendering'}
                  {status === 'completed' && 'Complete'}
                  {status === 'failed' && 'Failed'}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/70">
                <span>Style</span>
                <span className="font-semibold text-white line-clamp-1">
                  {selectedStyle ? ART_STYLES.find((s) => s.id === selectedStyle)?.name : customStyle || 'Not set'}
                </span>
              </div>
            </div>
          </div>

          <div className="desktop-window">
            <div className="desktop-titlebar">
              <span>Tips</span>
              <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-white/30">Desktop coach</span>
            </div>
            <div className="desktop-window__content space-y-3 text-sm text-white/80">
              <p>• Use balanced lighting and avoid motion blur.</p>
              <p>• Layer descriptors: “cinematic, rim light, volumetric fog”.</p>
              <p>• You can leave this window; the render continues in the background.</p>
            </div>
          </div>

          <div className="desktop-window">
            <div className="desktop-window__content">
              <button
                onClick={handleGenerate}
                disabled={loading || !selectedImage || (!selectedStyle && !customStyle)}
                className="w-full btn-accent text-lg shadow-[0_8px_32px_rgba(90,156,248,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {loading ? 'Generating...' : 'Generate avatar'}
              </button>
              <p className="text-xs text-white/50 text-center mt-3">
                Drops are optional — visit the Drop Drawer only when you’re ready.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
