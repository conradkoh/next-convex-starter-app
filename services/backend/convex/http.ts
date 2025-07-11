import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';

const http = httpRouter();

// Google OAuth callback for login
http.route({
  path: '/auth/google/callback',
  method: 'GET',
  handler: httpAction(async (_ctx, request) => {
    // Placeholder: parse query params (code, state, etc.)
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    // TODO: Exchange code for tokens, handle user login/creation
    return new Response(`Received code: ${code}, state: ${state}`, { status: 200 });
  }),
});

// Google OAuth callback for profile connect
http.route({
  path: '/app/profile/connect/google/callback',
  method: 'GET',
  handler: httpAction(async (_ctx, request) => {
    // Placeholder: parse query params (code, state, etc.)
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    // TODO: Exchange code for tokens, handle account linking
    return new Response(`Received code: ${code}, state: ${state}`, { status: 200 });
  }),
});

// Convex expects the router to be the default export
export default http;
