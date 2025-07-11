import { type NextRequest, NextResponse } from 'next/server';

/**
 * Google OAuth callback for profile connect - proxies to Convex HTTP endpoint
 * This allows the callback to come from the app's domain instead of Convex's domain
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
    // Get the Convex backend URL and convert to site URL for HTTP endpoints
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not set');
    }

    // Convert .cloud URL to .site URL for HTTP endpoints
    const convexSiteUrl = convexUrl.replace('.cloud', '.site');

    // Construct the Convex HTTP endpoint URL
    const convexHttpUrl = `${convexSiteUrl}/app/profile/connect/google/callback`;
    const convexCallbackUrl = new URL(convexHttpUrl);
    convexCallbackUrl.searchParams.set('code', code);
    convexCallbackUrl.searchParams.set('state', state);

    // Forward the request to Convex
    const response = await fetch(convexCallbackUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'NextJS-Proxy/1.0',
      },
    });

    // Get the response body and headers from Convex
    const body = await response.text();
    const contentType = response.headers.get('Content-Type') || 'text/html';

    // Return the response from Convex
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('Error proxying Google OAuth profile connect callback:', error);
    return new NextResponse(
      '<html><body>Internal server error during OAuth callback.</body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
