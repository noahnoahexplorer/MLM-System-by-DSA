import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { RootLayoutClient } from '@/components/layout/root-layout-client';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Profit Buddies!',
  description: 'Modern MLM Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add console log for debugging
  console.log('Root layout - rendering');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <RootLayoutClient>
            {children}
          </RootLayoutClient>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}