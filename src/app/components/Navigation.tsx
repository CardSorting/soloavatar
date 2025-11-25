'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const navItems = [
  { href: '/', label: 'Desktop', meta: 'Overview' },
  { href: '/avatars/create', label: 'Avatar Lab', meta: 'Core workflow' },
  { href: '/drops/create', label: 'Drop Drawer', meta: 'Optional' },
  { href: '/gallery/single-user', label: 'Library', meta: 'Archive' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeIndex = useMemo(() => {
    const idx = navItems.findIndex(
      (item) => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)),
    );
    return idx === -1 ? 0 : idx;
  }, [pathname]);

  const renderLinks = (variant: 'desktop' | 'mobile' = 'desktop') =>
    navItems.map((item) => {
      const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
      const baseClasses =
        'rounded-2xl border transition-all duration-300 ease-out flex flex-col items-start gap-1 px-5 py-4 group relative overflow-hidden';

      if (variant === 'desktop') {
        const desktopState = isActive
          ? 'border-amber-300/40 bg-amber-500/15 shadow-[0_8px_32px_rgba(251,191,36,0.25)] text-amber-100'
          : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]';

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${baseClasses} ${desktopState} animate-fade-in`}
            onClick={() => setIsMobileOpen(false)}
          >
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-amber-400/5 rounded-2xl" />
            )}
            <span className="text-sm font-semibold relative z-10">{item.label}</span>
            <span className="text-[0.65rem] uppercase tracking-[0.4em] opacity-60 relative z-10">
              {item.meta}
            </span>
            {item.meta === 'Optional' && (
              <span className="text-[10px] font-semibold text-emerald-200 rounded-full border border-emerald-200/60 px-2 py-0.5 mt-1 relative z-10">
                Optional
              </span>
            )}
          </Link>
        );
      }

      const mobileState = isActive ? 'bg-white/15 border-white/25' : 'border-white/10';
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`${baseClasses} ${mobileState}`}
          onClick={() => setIsMobileOpen(false)}
        >
          <span className="text-sm font-semibold">{item.label}</span>
          <span className="text-[0.65rem] uppercase tracking-[0.4em] text-white/40">{item.meta}</span>
          {item.meta === 'Optional' && (
            <span className="text-[10px] font-semibold text-emerald-200 rounded-full border border-emerald-200/60 px-2 py-0.5">
              Optional
            </span>
          )}
        </Link>
      );
    });

  return (
    <nav className="mb-8">
      <div
        className={`desktop-window dock-shadow transition-all duration-300`}
      >
        <div className="desktop-titlebar">
          <div className="desktop-titlebar__buttons">
            <span className="desktop-titlebar__button bg-[#ff5f57]" />
            <span className="desktop-titlebar__button bg-[#febc2e]" />
            <span className="desktop-titlebar__button bg-[#28c840]" />
          </div>
          <span className="ml-3 tracking-[0.4em] text-[0.6rem]">Avatar Desktop</span>
          <span className="ml-auto text-[0.6rem] uppercase tracking-[0.3em] text-white/35">
            Drops are now optional
          </span>
        </div>

        <div className="desktop-window__content pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shadow-inner shadow-white/10">
                <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 8h16M4 12h16M4 16h10"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold uppercase tracking-[0.4em] text-white/50">Avatar OS</span>
                <span className="text-2xl font-black tracking-tight text-white">Control Center</span>
              </div>
            </Link>

            <div className="hidden md:flex flex-1 items-center gap-3 justify-end">
              <div className="status-indicator status-online">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse-gentle" />
                Studio online
              </div>
              <Link
                href="/avatars/create"
                className="btn-accent"
              >
                Open Avatar Lab
              </Link>
            </div>

            <div className="md:hidden ml-auto">
              <button
                type="button"
                className="p-2 rounded-xl border border-white/10 text-white/80"
                aria-label="Menu"
                onClick={() => setIsMobileOpen((prev) => !prev)}
              >
                {isMobileOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="hidden md:flex gap-3 mt-6">{renderLinks('desktop')}</div>
        </div>

        {isMobileOpen && (
          <div className="md:hidden border-t border-white/10 px-5 py-4 bg-white/5 backdrop-blur">
            <div className="flex flex-col gap-3">{renderLinks('mobile')}</div>
            <Link
              href="/avatars/create"
              className="mt-4 w-full text-center px-4 py-3 rounded-2xl font-semibold border border-white/10 text-white hover:bg-white/10 transition"
              onClick={() => setIsMobileOpen(false)}
            >
              Open Avatar Lab
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
