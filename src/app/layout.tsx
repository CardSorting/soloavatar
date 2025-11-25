import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Avatar & Drop System',
  description: 'Avatar generation and NFT-style drop management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

