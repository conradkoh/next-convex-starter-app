'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { buildPwaManifest, getPwaStartUrlFromLocation } from '@/modules/pwa/pwa-manifest-config';

const MANIFEST_LINK_SELECTOR = 'link[rel="manifest"]';

function setManifestHref(startUrl: string): void {
  const manifestLink = document.querySelector<HTMLLinkElement>(MANIFEST_LINK_SELECTOR);
  if (!manifestLink) return;

  const manifest = buildPwaManifest(startUrl);
  const dataUrl = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(manifest)
  )}`;
  manifestLink.href = dataUrl;
}

/**
 * Rewrites the document manifest link so start_url matches the current route.
 * iOS reads this when the user taps Add to Home Screen.
 */
export function PwaManifestUpdater() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    const startUrl = getPwaStartUrlFromLocation(pathname, search ? `?${search}` : '');
    setManifestHref(startUrl);
  }, [pathname, search]);

  return null;
}
