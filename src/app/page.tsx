'use client';

import { useRouter } from 'next/navigation';

const stats = [
  { label: 'Styles & Templates', value: '25+', detail: 'Curated looks' },
  { label: 'Generated Avatars', value: '3.1k', detail: 'Local history' },
  { label: 'Optional Drops', value: '780+', detail: 'When you need them' },
];

const workflow = [
  {
    title: 'Capture',
    detail: 'Drag portraits or artwork into the Avatar Lab. The desktop client optimizes resolution & lighting.',
  },
  {
    title: 'Style',
    detail: 'Pick a preset or type your own directive, then let the render queue do its thing in the background.',
  },
  {
    title: 'Drop (Optional)',
    detail: 'When you need scarcity, open the Drop Drawer and package completed avatars with stock controls.',
  },
];

const featureCards = [
  {
    title: 'Avatar Lab',
    description: 'Core workspace for uploading portraits, applying styles, and monitoring generation status.',
    href: '/avatars/create',
    accent: 'text-sky-200',
    gradient: 'from-sky-500/40 to-cyan-500/20',
  },
  {
    title: 'Drop Drawer',
    description: 'Optional desktop drawer for wrapping avatars into limited releases with stock and story.',
    href: '/drops/create',
    accent: 'text-amber-200',
    gradient: 'from-amber-500/40 to-rose-500/20',
  },
];

export default function Home() {
  const router = useRouter();

  const handleViewGallery = () => {
    router.push('/gallery/single-user');
  };

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="desktop-window">
          <div className="desktop-titlebar">
            <span>Session overview</span>
            <div className="ml-auto">
              <div className="status-indicator status-online text-[0.6rem]">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse-gentle" />
                Live render queue
              </div>
            </div>
          </div>
          <div className="desktop-window__content space-y-8">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.4em] text-white/50">Personal desktop studio</p>
              <h1 className="text-4xl sm:text-5xl font-black leading-tight">
                Generate avatars, keep them local, and only drop when it feels right.
              </h1>
              <p className="text-white/70 text-lg max-w-3xl">
                The Avatar Desktop wraps your creative flow into windowed tools. The Drop Drawer is now fully optional—
                ship avatars, archive them, or package them into scarcity later with a single toggle.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="/avatars/create"
                className="flex-1 btn-accent text-center text-lg shadow-[0_8px_32px_rgba(90,156,248,0.4)]"
              >
                Launch Avatar Lab
              </a>
              <button
                onClick={handleViewGallery}
                className="flex-1 btn-primary text-center"
              >
                Open Library
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="desktop-pane bg-white/5 border-white/10">
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{stat.label}</p>
                  <p className="text-sm text-white/60">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="desktop-window">
            <div className="desktop-titlebar">
              <span>Desktop ticker</span>
            </div>
            <div className="desktop-window__content space-y-4">
              <div className="desktop-pane flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Queue ETA</p>
                  <p className="text-2xl font-semibold">00:45s</p>
                </div>
                <div className="status-indicator status-online">
                  Stable
                </div>
              </div>
              <div className="desktop-pane">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-2">Next action</p>
                <p className="font-semibold">Finish avatar #2418</p>
                <p className="text-white/60 text-sm">Drop drawer available when you’re ready — no rush.</p>
              </div>
              <div className="desktop-pane">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-1">Dock shortcuts</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">Avatar Lab</span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">Gallery</span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">Drop Drawer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {featureCards.map((card) => (
          <a key={card.title} href={card.href} className="desktop-window block group overflow-hidden">
            <div className="desktop-titlebar">
              <span>{card.title}</span>
              {card.title === 'Drop Drawer' && (
                <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-emerald-200">Optional</span>
              )}
            </div>
            <div className="desktop-window__content space-y-4">
              <div
                className={`rounded-2xl border border-white/10 bg-linear-to-br ${card.gradient} p-4 shadow-inner shadow-black/30`}
              >
                <p className="text-lg font-semibold">{card.title}</p>
              </div>
              <p className="text-white/70">{card.description}</p>
              <p className={`font-semibold ${card.accent} inline-flex items-center gap-2`}>
                Open workspace
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </p>
            </div>
          </a>
        ))}
      </div>

      <div className="desktop-window">
        <div className="desktop-titlebar">
          <span>Workflow map</span>
          <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-white/35">Drop optionality highlighted</span>
        </div>
        <div className="desktop-window__content space-y-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Flow</p>
              <h3 className="text-3xl font-bold">Windowed tools, choose-your-own finale.</h3>
            </div>
            <a
              href="/drops/create"
              className="btn-primary"
            >
              Peek at Drop Drawer
            </a>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {workflow.map((step, index) => (
              <div key={step.title} className="desktop-pane relative bg-black/20">
                <span className="absolute -top-4 left-4 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold">
                  0{index + 1}
                </span>
                <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                <p className="text-white/70 text-sm leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="desktop-window">
        <div className="desktop-titlebar">
          <span>Library snapshot</span>
        </div>
        <div className="desktop-window__content grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Gallery</p>
            <h3 className="text-3xl font-bold">Every render lands in your Library window.</h3>
            <p className="text-white/70">
              Share a drop link when you want to. Otherwise, your avatars stay neatly organized in the personal gallery.
            </p>
            <button
              onClick={handleViewGallery}
              className="rounded-2xl border border-white/20 bg-white text-gray-900 px-5 py-3 text-sm font-semibold shadow-[0_10px_40px_rgba(5,7,18,0.5)] hover:bg-slate-100 transition"
            >
              Launch Library
            </button>
          </div>
          <div className="desktop-pane space-y-4">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Latest activity</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse-gentle" />
                Synced
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">Avatar #2420</span>
                <span className="text-xs text-white/60">Completed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Drop “Neon Loom”</span>
                <span className="text-xs text-amber-200">Optional draft</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Avatar #2418</span>
                <span className="text-xs text-white/60">Queued</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
