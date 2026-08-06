'use client';

import { getSignupConfigLabel } from '@workspace/backend/config/signupMethods';
import { Settings, Shield, Ticket, Users } from 'lucide-react';
import { useMemo } from 'react';

import {
  ADMIN_ACCESS_PERMISSION,
  SYSTEM_ADMIN_ACCESS_PERMISSION,
  useHasPermission,
} from '@/application/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppInfo } from '@/modules/app/useAppInfo';
import { useAuthState } from '@/modules/auth/AuthProvider';

interface _StatusCardData {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function _buildGoogleAuthStatusCard(
  appInfo: ReturnType<typeof useAppInfo>['appInfo'],
  isLoading: boolean
): _StatusCardData {
  let value = 'Disabled';
  let description = 'Configuration required';

  if (isLoading) {
    value = '...';
    description = 'Loading...';
  } else if (appInfo?.googleAuthAvailable) {
    value = 'Enabled';
    description = 'Ready for user login';
  }

  return {
    title: 'Google Auth',
    value,
    description,
    icon: <Shield className="h-4 w-4 text-muted-foreground" />,
  };
}

// fallow-ignore-next-line complexity
function _buildStatusCards(
  appInfo: ReturnType<typeof useAppInfo>['appInfo'],
  isLoading: boolean,
  canManageAuthProviders: boolean,
  yourAccessLabel: string
): _StatusCardData[] {
  const cards: _StatusCardData[] = [
    {
      title: 'App Version',
      value: isLoading ? '...' : appInfo?.version || 'Unknown',
      description: 'Current version',
      icon: <Settings className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  if (canManageAuthProviders) {
    cards.push(_buildGoogleAuthStatusCard(appInfo, isLoading));
  }

  cards.push(
    {
      title: 'Sign-up Mode',
      value: getSignupConfigLabel(),
      description: 'Edit featureFlags.ts and redeploy to change',
      icon: <Ticket className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Your Access',
      value: yourAccessLabel,
      description: 'Effective permissions (not role name)',
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    }
  );

  return cards;
}

/**
 * Admin dashboard page displaying system status and configuration overview.
 * Shows app version, Google authentication status, and user access level.
 */
export default function AdminDashboard() {
  const authState = useAuthState();
  const hasSystemAdminAccess = useHasPermission(SYSTEM_ADMIN_ACCESS_PERMISSION);
  const hasAdminAccess = useHasPermission(ADMIN_ACCESS_PERMISSION);
  const canManageAuthProviders = useHasPermission('auth:provider:manage');
  const { appInfo, isLoading } = useAppInfo();

  // fallow-ignore-next-line complexity
  const yourAccessLabel = useMemo(() => {
    if (authState?.state !== 'authenticated') return '...';
    if (hasSystemAdminAccess) return 'System Administrator';
    if (hasAdminAccess) return 'Admin';
    return 'Standard User';
  }, [authState, hasAdminAccess, hasSystemAdminAccess]);

  const statusCards = useMemo(
    () => _buildStatusCards(appInfo, isLoading, canManageAuthProviders, yourAccessLabel),
    [appInfo, canManageAuthProviders, isLoading, yourAccessLabel]
  );

  /**
   * Memoized Google auth status for system information section.
   */
  const googleAuthStatus = useMemo(() => {
    if (isLoading) return { text: 'Loading...', className: 'text-muted-foreground' };

    if (appInfo?.googleAuthAvailable) {
      return { text: 'Active', className: 'text-green-600 dark:text-green-400' };
    }

    if (appInfo?.googleAuthDetails.isConfiguredInDatabase) {
      return { text: 'Disabled', className: 'text-yellow-600 dark:text-yellow-400' };
    }

    return { text: 'Unconfigured', className: 'text-red-600 dark:text-red-400' };
  }, [appInfo, isLoading]);

  return (
    <div className="pt-6 space-y-4 md:space-y-6">
      {_renderHeader()}
      {_renderStatusOverview(statusCards)}
      {canManageAuthProviders && _renderSystemInformation(googleAuthStatus)}
    </div>
  );
}

/**
 * Renders the dashboard header section.
 */
function _renderHeader() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl md:text-3xl font-bold">Admin</h1>
      <p className="text-sm md:text-base text-muted-foreground">Application administration</p>
    </div>
  );
}

/**
 * Renders the status overview cards grid.
 */
function _renderStatusOverview(statusCards: _StatusCardData[]) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statusCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl md:text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Renders the system information section.
 */
function _renderSystemInformation(googleAuthStatus: { text: string; className: string }) {
  return (
    <div className="space-y-3 md:space-y-4">
      <h2 className="text-lg md:text-xl font-semibold">System Information</h2>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Environment Status</CardTitle>
          <CardDescription className="text-sm">
            Current system configuration details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
              <span className="font-medium">Google Authentication:</span>
              <span className={googleAuthStatus.className}>{googleAuthStatus.text}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
