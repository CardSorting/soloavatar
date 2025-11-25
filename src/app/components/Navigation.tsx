'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/avatars/create', label: 'Create Avatar' },
    { href: '/drops/create', label: 'Create Drop' },
    { href: '/gallery/single-user', label: 'Gallery' },
  ];

  const renderLinks = (variant: 'desktop' | 'mobile' = 'desktop') =>
    navItems.map((item) => {
      const isActive = pathname === item.href ||
        (item.href !== '/' && pathname?.startsWith(item.href));

      const baseClasses =
        'px-4 py-2 rounded-xl font-semibold transition-all duration-200';

      const desktopState = isActive
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
        : 'text-gray-700 hover:bg-gray-100';

      const mobileState = isActive
        ? 'bg-gray-900 text-white'
        : 'text-gray-200 hover:text-white';

      return (
        <Link
          key={item.href}
          href={item.href}
          className={`${baseClasses} ${
            variant === 'desktop' ? desktopState : mobileState
          }`}
          onClick={() => setIsMobileOpen(false)}
        >
          {item.label}
        </Link>
      );
    });

  return (
    <nav className="sticky top-0 z-50">
      <div
        className={`relative border-b transition-all duration-300 ${
          isScrolled
            ? 'border-white/40 shadow-lg shadow-blue-500/10'
            : 'border-transparent'
        }`}
      >
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Avatar Studio
                </span>
                <span className="font-black text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-500">
                  Drop System
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {renderLinks('desktop')}
              <Link
                href="/avatars/create"
                className="ml-3 px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/30 hover:translate-y-0.5 transition-all duration-200"
              >
                Launch Studio
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Menu"
                onClick={() => setIsMobileOpen((prev) => !prev)}
              >
                {isMobileOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile panel */}
        {isMobileOpen && (
          <div className="md:hidden">
            <div className="px-4 pb-6 pt-2 bg-gray-900 text-white border-t border-white/10 shadow-2xl shadow-blue-900/30">
              <div className="flex flex-col gap-3">{renderLinks('mobile')}</div>
              <Link
                href="/avatars/create"
                className="mt-4 w-full text-center px-4 py-3 rounded-xl font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                Launch Studio
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

