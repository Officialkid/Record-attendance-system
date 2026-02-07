import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Christhood Ministry - Attendance Management',
  description: 'Track Your Ministry Growth with Precision and Purpose',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
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
