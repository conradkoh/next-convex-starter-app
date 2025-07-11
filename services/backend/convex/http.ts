import { httpRouter } from 'convex/server';
import type { SessionId } from 'convex-helpers/server/sessions';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { httpAction } from './_generated/server';

const http = httpRouter();

// Google OAuth callback for login
http.route({
  path: '/auth/google/callback',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // state is now loginRequestId

    if (!code || !state) {
      return new Response('<html><body>Missing required parameters.</body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    try {
      // Get the login request to extract sessionId and redirectUri
      const loginRequest = await ctx.runQuery(api.auth.google.getLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
      });
      if (!loginRequest || loginRequest.provider !== 'google') {
        throw new Error('Invalid login request');
      }

      // SECURITY: Check if login request has expired
      const now = Date.now();
      if (loginRequest.expiresAt && now > loginRequest.expiresAt) {
        throw new Error('Login request expired');
      }

      // Use the redirect URI that was stored with the login request
      const redirectUri = loginRequest.redirectUri;
      if (!redirectUri) {
        throw new Error('No redirect URI found in login request');
      }

      // Exchange code for Google profile
      const { profile, success } = await ctx.runAction(api.googleAuth.exchangeGoogleCode, {
        code,
        state,
        redirectUri,
      });
      if (!success) throw new Error('Google OAuth failed');

      // Find or create user and update session - using mutation
      const loginResult = await ctx.runMutation(api.googleAuth.loginWithGoogle, {
        profile,
        sessionId: loginRequest.sessionId as SessionId, // SessionId type casting
      });
      if (!loginResult.success) throw new Error('Login failed');

      // Mark login request as completed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'completed',
      });

      // Return HTML/JS to close the window
      return new Response(
        '<html><body><script>window.close();</script>Login successful. You may close this window.</body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    } catch (err) {
      // Mark login request as failed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return new Response(
        `<html><body>Login failed: ${err instanceof Error ? err.message : 'Unknown error'}</body></html>`,
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }
  }),
});

// Google OAuth callback for profile connect
http.route({
  path: '/app/profile/connect/google/callback',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // state is now loginRequestId

    if (!code || !state) {
      return new Response('<html><body>Missing required parameters.</body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    try {
      // Get the login request to extract sessionId and redirectUri
      const loginRequest = await ctx.runQuery(api.auth.google.getLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
      });
      if (!loginRequest || loginRequest.provider !== 'google') {
        throw new Error('Invalid login request');
      }

      // SECURITY: Check if login request has expired
      const now = Date.now();
      if (loginRequest.expiresAt && now > loginRequest.expiresAt) {
        throw new Error('Login request expired');
      }

      // Use the redirect URI that was stored with the login request
      const redirectUri = loginRequest.redirectUri;
      if (!redirectUri) {
        throw new Error('No redirect URI found in login request');
      }

      // Exchange code for Google profile
      const { profile, success } = await ctx.runAction(api.googleAuth.exchangeGoogleCode, {
        code,
        state,
        redirectUri,
      });
      if (!success) throw new Error('Google OAuth failed');

      // Connect Google account to existing user - using mutation
      const connectResult = await ctx.runMutation(api.googleAuth.connectGoogle, {
        profile,
        sessionId: loginRequest.sessionId as SessionId, // SessionId type casting
      });
      if (!connectResult.success) throw new Error('Connect failed');

      // Mark login request as completed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'completed',
      });

      // Return HTML/JS to close the window
      return new Response(
        '<html><body><script>window.close();</script>Account connected successfully. You may close this window.</body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    } catch (err) {
      // Mark login request as failed
      await ctx.runMutation(api.auth.google.completeLoginRequest, {
        loginRequestId: state as Id<'auth_loginRequests'>,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return new Response(
        `<html><body>Connect failed: ${err instanceof Error ? err.message : 'Unknown error'}</body></html>`,
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }
  }),
});

// Convex expects the router to be the default export
export default http;
