import { api } from '@workspace/backend/convex/_generated/api';
import { fetchAction } from 'convex/nextjs';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth callback for login - calls Convex action directly using type-safe fetchAction
 * This processes the OAuth callback and handles the authentication flow
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Debug: Log incoming request URL and params
  console.log('[Google OAuth Callback] Incoming request URL:', request.url);
  console.log('[Google OAuth Callback] code:', code, 'state:', state);

  // Validate required parameters
  if (!code || !state) {
    console.warn('[Google OAuth Callback] Missing required parameters: code or state');
    return new NextResponse(
      '<html><body>Missing required parameters for OAuth callback.</body></html>',
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  try {
    console.log(
      '[Google OAuth Callback] Calling Convex action:',
      'auth.google.handleGoogleLoginCallback'
    );

    // Call the Convex action using type-safe fetchAction
    const result = await fetchAction(api.auth.google.handleGoogleLoginCallback, {
      code,
      state,
    });

    console.log('[Google OAuth Callback] Convex action result:', result);

    if (result.success) {
      // Return HTML/JS to close the window
      return new NextResponse(
        '<html><body><script>window.close();</script>Login successful. You may close this window.</body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }
    // Handle failure
    return new NextResponse(
      `<html><body>Login failed: ${result.error || 'Unknown error'}</body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Error calling Convex Google OAuth callback:', error);
    return new NextResponse(
      '<html><body>Internal server error during OAuth callback.</body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
