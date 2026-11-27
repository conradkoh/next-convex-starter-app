'use client';

import { RouteError } from '@/modules/errors/RouteError';

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} scope="route:admin" homeHref="/app" homeLabel="Back to app" />;
}
