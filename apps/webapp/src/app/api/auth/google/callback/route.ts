import { api } from '@workspace/backend/convex/_generated/api';
import { fetchAction } from 'convex/nextjs';
import { type NextRequest, NextResponse } from 'next/server';

// Public interfaces and types
export interface GoogleOAuthCallbackResult {
  success: boolean;
  flowType?: 'login' | 'connect';
  error?: string;
}

/**
 * Unified Google OAuth callback - handles both login and profile connect flows.
 * This processes the OAuth callback and automatically determines the flow type based on redirectUri.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Validate required parameters
  if (!code || !state) {
    return new NextResponse(
      '<html><body>Missing required parameters for OAuth callback.</body></html>',
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  try {
    // Call the unified Convex action using type-safe fetchAction
    const result = await fetchAction(api.auth.google.handleGoogleCallback, {
      code,
      state,
    });

    if (result.success) {
      // Customize success message based on flow type
      const successMessage =
        result.flowType === 'connect'
          ? 'Account connected successfully. You may close this window.'
          : 'Login successful. You may close this window.';

      // Return HTML/JS to close the window
      return new NextResponse(
        `<html><body><script>window.close();</script>${successMessage}</body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Handle failure
    return new NextResponse(
      `<html><body>OAuth failed: ${result.error || 'Unknown error'}</body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (_error) {
    return new NextResponse(
      '<html><body>Internal server error during OAuth callback.</body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
