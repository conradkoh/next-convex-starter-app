'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAppInfo } from '@/modules/app/useAppInfo';
import { api } from '@workspace/backend/convex/_generated/api';
import { useSessionMutation, useSessionQuery } from 'convex-helpers/react/sessions';
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Save,
  TestTube,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function GoogleAuthConfigPage() {
  const { appInfo, isLoading: appInfoLoading } = useAppInfo();

  // Generate redirect URIs based on current domain
  const getRedirectUris = () => {
    if (typeof window === 'undefined') return [];

    const { protocol, host } = window.location;
    const baseUrl = `${protocol}//${host}`;

    return [
      `${baseUrl}/login/google/callback`,
      // Add localhost for development if not already localhost
      ...(host.includes('localhost') ? [] : ['http://localhost:3000/login/google/callback']),
    ];
  };

  const redirectUris = getRedirectUris();

  // State for form inputs
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [clientSecretFocused, setClientSecretFocused] = useState(false);

  // Convex queries and mutations
  const configData = useSessionQuery(api.system.thirdPartyAuthConfig.getGoogleAuthConfig);
  const updateConfig = useSessionMutation(api.system.thirdPartyAuthConfig.updateGoogleAuthConfig);
  const toggleEnabled = useSessionMutation(api.system.thirdPartyAuthConfig.toggleGoogleAuthEnabled);
  const testConfig = useSessionMutation(api.system.thirdPartyAuthConfig.testGoogleAuthConfig);
  const resetConfig = useSessionMutation(api.system.thirdPartyAuthConfig.resetGoogleAuthConfig);

  // Load existing configuration
  useEffect(() => {
    if (configData) {
      setEnabled(configData.enabled);
      setClientId(configData.clientId || '');
      setClientSecret(''); // Never load the actual secret for security
      setIsConfigured(configData.isConfigured);
    }
  }, [configData]);

  // Copy to clipboard helper
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Compute display value for client secret field
  const getClientSecretDisplayValue = () => {
    const hasExistingSecret = configData?.hasClientSecret;
    const hasUserInput = clientSecret.length > 0;

    // If there's an existing secret, field is not focused, and user hasn't entered anything
    if (hasExistingSecret && !clientSecretFocused && !hasUserInput) {
      return '••••••••••••••••••••••••••••••••';
    }

    // Otherwise show the actual input value
    return clientSecret;
  };

  // Handle client secret focus
  const handleClientSecretFocus = () => {
    setClientSecretFocused(true);
  };

  // Handle client secret blur
  const handleClientSecretBlur = () => {
    setClientSecretFocused(false);
  };

  // Handle enable/disable toggle
  const handleToggleEnabled = async (newEnabled: boolean) => {
    try {
      await toggleEnabled({ enabled: newEnabled });
      setEnabled(newEnabled);
      toast.success(`Google Auth ${newEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Failed to toggle Google Auth:', error);
      toast.error('Failed to toggle Google Auth. Please try again.');
    }
  };

  // Handle form submission
  const handleSave = async () => {
    setIsFormLoading(true);
    try {
      if (redirectUris.length === 0) {
        toast.error('No redirect URIs available. Please refresh the page.');
        return;
      }

      if (!clientId.trim()) {
        toast.error('Client ID is required');
        return;
      }

      // Check if client secret is required (new configuration or replacing existing)
      const hasExistingSecret = configData?.hasClientSecret;
      if (!hasExistingSecret && !clientSecret.trim()) {
        toast.error('Client Secret is required for new configuration');
        return;
      }

      await updateConfig({
        enabled, // Keep current enabled state
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(), // Backend will preserve existing if empty and one exists
        redirectUris: redirectUris,
      });

      toast.success('Google Auth configuration saved successfully');
      setIsConfigured(true);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration. Please try again.');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handle configuration test
  const handleTest = async () => {
    // Check if there's any configuration to test
    if (!clientId.trim() && !clientSecret.trim()) {
      toast.error('Please enter at least a Client ID or Client Secret to test');
      return;
    }

    try {
      const result = await testConfig({});
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        // Show additional details if available
        if (result.details?.issues) {
          console.log('Configuration issues:', result.details.issues);
        }
      }
    } catch (error) {
      console.error('Failed to test configuration:', error);
      toast.error('Failed to test configuration. Please try again.');
    }
  };

  // Handle configuration reset
  const handleReset = async () => {
    if (
      !confirm(
        'Are you sure you want to reset the Google Auth configuration? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await resetConfig({});
      toast.success('Google Auth configuration has been reset');
      // Note: enabled state is preserved and handled separately
      setClientId('');
      setClientSecret('');
      setIsConfigured(false);
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      toast.error('Failed to reset configuration. Please try again.');
    }
  };

  const isFullyConfigured = isConfigured && enabled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Google Authentication Configuration</h1>
        <p className="text-muted-foreground">Configure Google OAuth for user authentication</p>
      </div>

      {/* Enable/Disable Control */}
      <Card>
        <CardHeader>
          <CardTitle>Google Authentication Control</CardTitle>
          <CardDescription>Enable or disable Google Authentication for your users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="google-auth-enabled" className="text-base font-medium">
                Google Authentication
              </Label>
              <p className="text-sm text-muted-foreground">
                {enabled ? 'Users can sign in with Google' : 'Google sign-in is disabled'}
              </p>
            </div>
            <Switch
              id="google-auth-enabled"
              checked={enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
          <CardDescription>Current state of Google Authentication setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Configuration Status</span>
              <div className="flex items-center gap-2">
                {isConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Configured</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Not Configured</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Status</span>
              <div className="flex items-center gap-2">
                {isFullyConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Ready</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-600">Setup Required</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Google Cloud Console Setup</CardTitle>
          <CardDescription>Configure your Google OAuth application settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Google Client ID</Label>
            <Input
              id="clientId"
              placeholder="e.g., 123456789012-abcdefghijklmnop.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Copy this from your Google Cloud Console OAuth 2.0 Client IDs
            </p>
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="clientSecret">Google Client Secret</Label>
              {configData && (
                <div className="flex items-center gap-2">
                  {configData.hasClientSecret ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-amber-600 font-medium">Not Set</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <Input
              id="clientSecret"
              type="password"
              placeholder={
                configData?.hasClientSecret
                  ? 'Enter new client secret (leave empty to keep current)'
                  : 'Enter your Google Client Secret'
              }
              value={getClientSecretDisplayValue()}
              onChange={(e) => setClientSecret(e.target.value)}
              onFocus={handleClientSecretFocus}
              onBlur={handleClientSecretBlur}
            />
            <p className="text-xs text-muted-foreground">
              {configData?.hasClientSecret ? (
                <>
                  A client secret is already configured. Click to enter a new secret, or leave empty
                  to keep the current one.
                </>
              ) : (
                <>Copy this from your Google Cloud Console OAuth 2.0 Client IDs</>
              )}
            </p>
          </div>

          <Separator />

          {/* Redirect URIs */}
          <div className="space-y-4">
            <div>
              <Label>Authorized Redirect URIs</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Copy these URIs and add them to your Google Cloud Console OAuth configuration
              </p>
            </div>

            <div className="space-y-2">
              {redirectUris.map((uri) => (
                <div key={uri} className="flex gap-2">
                  <Input value={uri} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(uri)}>
                    Copy
                  </Button>
                </div>
              ))}
            </div>

            {redirectUris.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Redirect URIs will be generated automatically based on your current domain.
              </p>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isFormLoading}>
              {isFormLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Configuration
            </Button>

            {(clientId.trim() || clientSecret.trim()) && (
              <Button variant="outline" onClick={handleTest}>
                <TestTube className="mr-2 h-4 w-4" />
                Test Configuration
              </Button>
            )}

            {configData && (
              <Button variant="destructive" onClick={handleReset}>
                Reset Configuration
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Step-by-step guide to configure Google OAuth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Create Google Cloud Project</h4>
              <p className="text-muted-foreground mb-2">
                Go to the Google Cloud Console and create a new project or select an existing one.
              </p>
              <Link
                href="https://console.cloud.google.com"
                target="_blank"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                Google Cloud Console
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Enable Google+ API</h4>
              <p className="text-muted-foreground">
                In the Google Cloud Console, navigate to APIs & Services → Library and enable the
                Google+ API.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Create OAuth 2.0 Credentials</h4>
              <p className="text-muted-foreground">
                Go to APIs & Services → Credentials and create OAuth 2.0 Client IDs for a web
                application.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Add Redirect URIs</h4>
              <p className="text-muted-foreground">
                Copy the redirect URIs shown above and paste them into the "Authorized redirect
                URIs" section in Google Cloud Console.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">5. Complete This Form</h4>
              <p className="text-muted-foreground">
                Copy your Client ID and Client Secret from Google Cloud Console and paste them into
                the form above, then enable the service.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
