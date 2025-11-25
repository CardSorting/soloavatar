'use client';

import { useRouter } from 'next/navigation';

const stats = [
  { label: 'Styles & Templates', value: '25+', accent: 'from-blue-500/20 to-blue-500/5' },
  { label: 'Generated Avatars', value: '3.1k', accent: 'from-purple-500/20 to-purple-500/5' },
  { label: 'Instant Drops', value: '780+', accent: 'from-fuchsia-500/20 to-fuchsia-500/5' },
];

const workflow = [
  { title: 'Upload & Prep', detail: 'Drop any portrait or artwork and let us optimize it automatically.' },
  { title: 'Style & Generate', detail: 'Pick curated styles or craft your own prompt for AI remastering.' },
  { title: 'Launch the Drop', detail: 'Package your avatar into a collectible instantly, with stock controls.' },
];

const featureCards = [
  {
    title: 'Create Avatar',
    description: 'Generate styled avatars from your images using AI-powered transformations.',
    href: '/avatars/create',
    color: 'from-blue-500 to-indigo-600',
    accent: 'text-blue-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Create Drop',
    description: 'Turn any avatar into a limited drop with stock limits and instant claims.',
    href: '/drops/create',
    color: 'from-purple-500 to-fuchsia-600',
    accent: 'text-purple-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
];

export default function Home() {
  const router = useRouter();

  const handleViewGallery = () => {
    router.push('/gallery/single-user');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(192,132,252,0.25),_transparent_40%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Hero */}
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-blue-100 mb-6">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live AI Avatar Studio
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Craft avatars, stage drops, own your visual identity.
            </h1>
            <p className="text-lg text-white/70 mb-8">
              Upload any portrait, remix styles in seconds, and launch claim-ready drops
              with a single click. Designed for creators who want high-impact visuals without
              the production team.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="/avatars/create"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/30 hover:translate-y-0.5 transition-all"
              >
                Launch Avatar Studio
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 12h16" />
                </svg>
              </a>
              <button
                onClick={handleViewGallery}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold border border-white/20 text-white hover:bg-white/10 transition"
              >
                View Gallery
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5v-5M10 14l6-6m0 0h-5m5 0v5" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`p-4 rounded-2xl border border-white/10 bg-gradient-to-br ${stat.accent} backdrop-blur`}
                >
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/40 to-purple-500/30 blur-3xl" aria-hidden />
            <div className="relative rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl shadow-blue-900/40">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">Live Workflow</p>
                  <p className="text-xl font-semibold">Remix session</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-300/30">
                  Online
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                  <p className="text-sm text-white/60 mb-2">Input</p>
                  <p className="font-semibold">Portrait.jpg ➜ Cyberpunk Neon</p>
                  <p className="text-sm text-white/60">+ chromatic aberration · + neon haze · + AI polish</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/60 mb-2">Output Preview</p>
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 flex items-center justify-center text-white/40 text-sm tracking-[0.4em] uppercase">
                    Avatar Render
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3">
                    <p className="text-xs text-blue-100 uppercase tracking-widest">Queue</p>
                    <p className="font-semibold text-white">00:42s ETA</p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-purple-400/30 bg-purple-500/10 px-4 py-3">
                    <p className="text-xs text-purple-100 uppercase tracking-widest">Drop Ready</p>
                    <p className="font-semibold text-white">Stock 25</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureCards.map((feature) => (
            <a
              key={feature.title}
              href={feature.href}
              className="group relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur hover:border-white/30 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${feature.color} blur-3xl`} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/40 to-white/10 flex items-center justify-center mb-6 shadow-inner shadow-white/20">
                  {feature.icon}
                </div>
                <h2 className="text-3xl font-bold mb-3">{feature.title}</h2>
                <p className="text-white/70 mb-6">{feature.description}</p>
                <div className={`flex items-center font-semibold ${feature.accent} group-hover:translate-x-2 transition-transform`}>
                  Get started
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </section>

        {/* Workflow */}
        <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-2">Flow</p>
              <h3 className="text-3xl font-bold">From inspiration to drop in 3 guided steps.</h3>
            </div>
            <a
              href="/drops/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition"
            >
              Create a drop
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 12h16" />
              </svg>
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {workflow.map((step, index) => (
              <div key={step.title} className="relative p-6 rounded-3xl border border-white/10 bg-slate-950/40">
                <div className="absolute -top-5 left-6 w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                  0{index + 1}
                </div>
                <h4 className="text-xl font-semibold mb-3 mt-4">{step.title}</h4>
                <p className="text-white/70 text-sm leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-8 py-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-pink-500/20 opacity-80" aria-hidden />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-2">Gallery</p>
              <h3 className="text-3xl font-bold mb-4">Everything you create lives in one vibrant gallery.</h3>
              <p className="text-white/70 mb-6">
                Track statuses, share drops, and revisit previous generations at any time.
                Your visual history is archived automatically.
              </p>
              <button
                onClick={handleViewGallery}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-white text-gray-900 hover:bg-gray-100 transition"
              >
                Open gallery
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 12h16" />
                </svg>
              </button>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Latest Drop</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>Stock</span>
                  <span>18 / 25 claimed</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-400" style={{ width: '72%' }} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Avatar slots</p>
                  <p className="text-lg font-semibold">48 saved</p>
                </div>
                <a href="/avatars/create" className="text-sm font-semibold text-indigo-300 hover:text-white transition">
                  Add new +
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

