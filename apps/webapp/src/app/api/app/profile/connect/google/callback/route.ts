import { api } from '@workspace/backend/convex/_generated/api';
import { fetchAction } from 'convex/nextjs';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth callback for profile connect - calls Convex action directly using type-safe fetchAction
 * This processes the OAuth callback and handles the account linking flow
 */
export async function GET(request: NextRequest) {
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
    // Call the Convex action using type-safe fetchAction
    const result = await fetchAction(api.auth.google.handleGoogleConnectCallback, {
      code,
      state,
    });

    if (result.success) {
      // Return HTML/JS to close the window
      return new NextResponse(
        '<html><body><script>window.close();</script>Account connected successfully. You may close this window.</body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }
    // Handle failure
    return new NextResponse(
      `<html><body>Connect failed: ${result.error || 'Unknown error'}</body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Error calling Convex Google connect callback:', error);
    return new NextResponse(
      '<html><body>Internal server error during OAuth callback.</body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
