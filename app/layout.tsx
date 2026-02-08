import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/AuthContext';
import PwaUpdatePrompt from '@/components/PwaUpdatePrompt';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Insight Tracker - Turn Attendance into Actionable Insights',
  description: 'Track events, analyze trends, and grow your community with beautiful analytics.',
  keywords: 'attendance tracking, event analytics, church management, NGO tools, corporate events, visitor tracking',
  manifest: '/manifest.json',
  themeColor: '#4b248c',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Insight Tracker',
  },
  openGraph: {
    title: 'Insight Tracker',
    description: 'Turn attendance into actionable insights',
    type: 'website',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="application-name" content="Insight Tracker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Insight Tracker" />
        <meta name="theme-color" content="#4b248c" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
        <PwaUpdatePrompt />
        <Toaster 
          position="top-right"
          toastOptions={{
            // Success toasts
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
                color: 'white',
                fontWeight: '500',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#10b981',
              },
            },
            // Error toasts
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
                color: 'white',
                fontWeight: '500',
              },
              iconTheme: {
                primary: 'white',
                secondary: '#ef4444',
              },
            },
            // Loading toasts
            loading: {
              style: {
                background: '#3b82f6',
                color: 'white',
                fontWeight: '500',
              },
            },
            // Default style
            style: {
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
