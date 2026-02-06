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
            success: { 
              duration: 3000, 
              style: { 
                background: '#22c55e',
                color: '#fff',
                fontWeight: '600',
              } 
            },
            error: { 
              duration: 5000, 
              style: { 
                background: '#ef4444',
                color: '#fff',
                fontWeight: '600',
              } 
            },
            loading: {
              style: {
                background: '#0047AB',
                color: '#fff',
                fontWeight: '600',
              }
            }
          }}
        />
      </body>
    </html>
  );
}
