import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/app/ConvexClientProvider';
import { Navigation } from '@/components/Navigation';
import { Toaster } from '@/components/ui/sonner';
import { AppInfoProvider } from '@/modules/app/AppInfoProvider';
import { AuthProvider } from '@/modules/auth/AuthProvider';
import { ThemeProvider } from '@/modules/theme/ThemeProvider';
import type { Theme } from '@/modules/theme/theme-utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Next Convex App',
  description: 'A Next.js app with Convex backend',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Next Convex App',
  },
  applicationName: 'Next Convex App',
  formatDetection: {
    telephone: false,
  },
};

/**
 * Root layout component that wraps the entire application with providers and global structure.
 * Sets up authentication, theming, navigation, and toast notifications for all pages.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/appicon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider>
          <AppInfoProvider>
            <AuthProvider>
              <ThemeProvider>
                <div className="flex flex-col h-screen overflow-hidden">
                  <Navigation />
                  <main className="flex-1 flex flex-col overflow-scroll">{children}</main>
                </div>
              </ThemeProvider>
            </AuthProvider>
          </AppInfoProvider>
        </ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
