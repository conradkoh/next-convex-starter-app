'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/lib/auth/AuthProvider';
import { useAppInfo } from '@/modules/app/useAppInfo';
import { ExternalLink, Settings, Shield, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const authState = useAuthState();
  const { appInfo, isLoading } = useAppInfo();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          System administration and configuration panel
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Version</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl md:text-2xl font-bold">
              {isLoading ? '...' : appInfo?.version || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">Current version</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Google Auth</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl md:text-2xl font-bold">
              {isLoading ? '...' : appInfo?.googleAuthAvailable ? 'Enabled' : 'Disabled'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? 'Loading...'
                : appInfo?.googleAuthAvailable
                  ? 'Ready for user login'
                  : 'Configuration required'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Access</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl md:text-2xl font-bold">
              {authState?.state === 'authenticated'
                ? authState.accessLevel === 'system_admin'
                  ? 'Admin'
                  : 'User'
                : '...'}
            </div>
            <p className="text-xs text-muted-foreground">Access level</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3 md:space-y-4">
        <h2 className="text-lg md:text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Shield className="h-4 w-4 md:h-5 md:w-5" />
                Google Authentication Setup
              </CardTitle>
              <CardDescription className="text-sm">
                Configure Google OAuth for user authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Status:{' '}
                  {isLoading
                    ? 'Loading...'
                    : appInfo?.googleAuthAvailable
                      ? 'Configured and ready'
                      : 'Configuration needed'}
                </p>
                <Link href="/app/admin/google-auth">
                  <Button className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span className="text-sm md:text-base">Configure Google Auth</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Information */}
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
                <span
                  className={
                    isLoading
                      ? 'text-muted-foreground'
                      : appInfo?.googleAuthAvailable
                        ? 'text-green-600'
                        : appInfo?.googleAuthDetails.isConfiguredInDatabase
                          ? 'text-yellow-600'
                          : 'text-red-600'
                  }
                >
                  {isLoading
                    ? 'Loading...'
                    : appInfo?.googleAuthAvailable
                      ? 'Active'
                      : appInfo?.googleAuthDetails.isConfiguredInDatabase
                        ? 'Disabled'
                        : 'Unconfigured'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
