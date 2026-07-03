import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import PwaUpdatePrompt from '@/components/PwaUpdatePrompt';
import { PwaInstallPrompt } from '@/components/cap/pwa-install-prompt';
import { PwaRegister } from '@/components/cap/pwa-register';
import { CapSessionProvider } from '@/components/cap/session-provider';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'] });
const headingFont = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  applicationName: 'CIOM Portal',
  title: 'CIOM Portal',
  description: 'CIOM Portal helps every department know what to do next, from first-time sign-in to weekly records, meetings, and ministry trends.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CIOM Portal',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#4B248C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.className} ${headingFont.variable}`}>
        <CapSessionProvider>
          <PwaRegister />
          {children}
          <Toaster position="top-right" />
          <PwaInstallPrompt />
          <PwaUpdatePrompt />
        </CapSessionProvider>
      </body>
    </html>
  );
}
