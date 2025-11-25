import type { Metadata } from 'next';
import './globals.css';
import { initializeApplication } from '../lib/server/infrastructure/init';
import Navigation from './components/Navigation';

// Only run initialization on server side
if (typeof window === 'undefined') {
  // Run initialization asynchronously (don't await in top-level)
  initializeApplication().then((result) => {
    if (!result.success) {
      console.error('Application initialization failed:', result.errors);
      // In development, we might want to throw, but for production, log and continue
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Application initialization failed: ${result.errors?.join(', ')}`);
      }
    }
  }).catch((error) => {
    console.error('Unexpected initialization error:', error);
  });
}

export const metadata: Metadata = {
  title: 'Avatar & Drop System',
  description: 'Avatar generation and NFT-style drop management with local storage',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
