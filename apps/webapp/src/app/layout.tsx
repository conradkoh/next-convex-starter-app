import { ConvexQueryCacheProvider } from 'convex-helpers/react/cache/provider';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';

import './globals.css';
import { AppMain } from '@/app/AppMain';
import { ConvexClientProvider } from '@/app/ConvexClientProvider';
import { Navigation } from '@/components/Navigation';
import { AppInfoProvider } from '@/modules/app/AppInfoProvider';
import { AuthProvider } from '@/modules/auth/AuthProvider';
import { AppUnavailable } from '@/modules/errors/AppUnavailable';
import { ErrorBoundary } from '@/modules/errors/ErrorBoundary';
import { NavigationFallback } from '@/modules/errors/NavigationFallback';
import { PwaInstallProvider, InstallAppMobileBanner } from '@/modules/pwa-install';
import { ThemeProvider, themeScript } from '@/modules/theme/ThemeProvider';
import { uiScaleScript } from '@/modules/ui-scale/ui-scale-script';
import { UiScaleProvider } from '@/modules/ui-scale/UiScaleProvider';

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
  themeColor: '#ffffff',
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
 * Sets up authentication, theming, and navigation for all pages.
 * Contains three error boundaries: providers (whole-app screen), navigation (minimal header),
 * and install banner (silent removal), so a render failure is contained to its smallest region.
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
        <meta name="theme-color" content="#ffffff" />
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <Script id="ui-scale-init" strategy="beforeInteractive">
          {uiScaleScript}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary scope="app-providers" fallback={<AppUnavailable />}>
          <ConvexClientProvider>
            <ConvexQueryCacheProvider>
              <AppInfoProvider>
                <AuthProvider>
                  <ThemeProvider>
                    <UiScaleProvider>
                      <PwaInstallProvider>
                        <div className="flex h-dvh flex-col overflow-hidden">
                          <ErrorBoundary scope="navigation" fallback={<NavigationFallback />}>
                            <Navigation />
                          </ErrorBoundary>
                          <AppMain>
                            <ErrorBoundary scope="install-banner" fallback={null}>
                              <InstallAppMobileBanner />
                            </ErrorBoundary>
                            {children}
                          </AppMain>
                        </div>
                      </PwaInstallProvider>
                    </UiScaleProvider>
                  </ThemeProvider>
                </AuthProvider>
              </AppInfoProvider>
            </ConvexQueryCacheProvider>
          </ConvexClientProvider>
        </ErrorBoundary>
        {/* React Grab for development */}
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
