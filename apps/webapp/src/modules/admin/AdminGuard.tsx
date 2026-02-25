'use client';

import { ArrowLeft, Loader2, ShieldX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { useHasPermission, useHasRole } from '@/modules/auth/permissions';

export interface AdminGuardProps {
  children: ReactNode;
  fallbackTo?: string;
  /**
   * Optional permission required to access this area.
   * If not specified, defaults to checking for 'system_admin' role.
   */
  requiredPermission?: string;
}

/**
 * Admin guard component that restricts access based on RBAC permissions.
 * Redirects unauthenticated users to login and shows access denied for unauthorized users.
 *
 * @example
 * // Require system_admin role (default)
 * <AdminGuard>
 *   <AdminDashboard />
 * </AdminGuard>
 *
 * @example
 * // Require specific permission
 * <AdminGuard requiredPermission="settings.write">
 *   <SettingsPage />
 * </AdminGuard>
 */
export function AdminGuard({ children, fallbackTo = '/app', requiredPermission }: AdminGuardProps) {
  const authState = useAuthState();
  const router = useRouter();

  // Check permission or role based on what's required
  const hasRequiredPermission = useHasPermission(requiredPermission ?? 'users.manage');
  const isSystemAdmin = useHasRole('system_admin');

  // Determine if user has access
  const hasAccess = requiredPermission ? hasRequiredPermission : isSystemAdmin;

  /**
   * Redirects unauthenticated users to the login page.
   */
  const redirectToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (authState?.state === 'unauthenticated') {
      redirectToLogin();
    }
  }, [authState, redirectToLogin]);

  if (authState === undefined || hasAccess === undefined) {
    return _renderLoadingState('Checking access permissions...');
  }

  if (authState.state === 'unauthenticated') {
    return _renderLoadingState('Redirecting to login...');
  }

  if (!hasAccess) {
    const currentRoles = authState.roles.join(', ') || 'none';
    const required = requiredPermission ?? 'system_admin role';
    return _renderAccessDeniedState(currentRoles, required, fallbackTo);
  }

  return <>{children}</>;
}

/**
 * Renders a loading state with spinner and message.
 */
function _renderLoadingState(message: string) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Renders the access denied state for unauthorized users.
 */
function _renderAccessDeniedState(currentRoles: string, required: string, fallbackTo: string) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <ShieldX className="mx-auto h-16 w-16 text-destructive/60" />
              <h1 className="text-2xl font-semibold">Access Denied</h1>
              <p className="text-muted-foreground">
                You don&apos;t have permission to access this area.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your roles: <span className="font-medium">{currentRoles}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Required: <span className="font-medium">{required}</span>
              </p>
            </div>

            <div className="pt-4">
              <Link href={fallbackTo}>
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Application
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
