'use client';

import { RouteError } from '@/modules/errors/RouteError';

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} scope="route:root" />;
}
