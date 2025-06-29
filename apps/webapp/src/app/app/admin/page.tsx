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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System administration and configuration panel</p>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Version</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
          <CardContent>
            <div className="text-2xl font-bold">
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
          <CardContent>
            <div className="text-2xl font-bold">
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Google Authentication Setup
              </CardTitle>
              <CardDescription>Configure Google OAuth for user authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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
                    Configure Google Auth
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">System Information</h2>
        <Card>
          <CardHeader>
            <CardTitle>Environment Status</CardTitle>
            <CardDescription>Current system configuration details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Google Auth Credentials:</span>
                <span
                  className={
                    isLoading
                      ? 'text-muted-foreground'
                      : appInfo?.googleAuthDetails.hasClientId &&
                          appInfo?.googleAuthDetails.hasClientSecret
                        ? 'text-green-600'
                        : 'text-red-600'
                  }
                >
                  {isLoading
                    ? 'Loading...'
                    : appInfo?.googleAuthDetails.hasClientId &&
                        appInfo?.googleAuthDetails.hasClientSecret
                      ? 'Configured'
                      : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Google Auth Database Config:</span>
                <span
                  className={
                    isLoading
                      ? 'text-muted-foreground'
                      : appInfo?.googleAuthDetails.isConfiguredInDatabase
                        ? 'text-green-600'
                        : 'text-red-600'
                  }
                >
                  {isLoading
                    ? 'Loading...'
                    : appInfo?.googleAuthDetails.isConfiguredInDatabase
                      ? 'Configured'
                      : 'Not configured'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
