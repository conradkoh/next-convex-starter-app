'use client';

import { RequireLogin } from '@/lib/auth/RequireLogin';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RequireLogin>{children}</RequireLogin>;
}
