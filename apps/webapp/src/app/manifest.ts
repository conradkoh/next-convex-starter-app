import type { MetadataRoute } from 'next';

import { buildPwaManifest, DEFAULT_PWA_START_URL } from '@/modules/pwa/pwa-manifest-config';

export default function manifest(): MetadataRoute.Manifest {
  return buildPwaManifest(DEFAULT_PWA_START_URL);
}
