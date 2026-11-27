'use client';

import { RouteError } from '@/modules/errors/RouteError';

export default function SystemAdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError {...props} scope="route:system-admin" homeHref="/app" homeLabel="Back to app" />
  );
}
