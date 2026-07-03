import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import { CapSessionProvider } from '@/components/cap/session-provider';
import './globals.css';

const bodyFont = Inter({ subsets: ['latin'] });
const headingFont = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'Christhood Accountability Platform',
  description: 'Invite-only accountability, records, insights, and meetings portal for Christhood Outfield Ministries International.',
};

export const viewport: Viewport = {
  themeColor: '#4B248C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.className} ${headingFont.variable}`}>
        <CapSessionProvider>
          {children}
          <Toaster position="top-right" />
        </CapSessionProvider>
      </body>
    </html>
  );
}
