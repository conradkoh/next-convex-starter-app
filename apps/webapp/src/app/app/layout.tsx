'use client';

import { RequireLogin } from '@/lib/auth/RequireLogin';

/**
 * Displays the main application layout with authentication requirement for all child routes.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RequireLogin>{children}</RequireLogin>;
}
