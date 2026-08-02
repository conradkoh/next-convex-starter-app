/**
 * Upstream-owned UI flows from the next-convex-starter-app template.
 * Downstream forks: add your flows in specs/downstream/ — do NOT modify upstream specs
 * unless you intend to contribute back to the template.
 *
 * These flows form the regression baseline for the upcoming base UI migration.
 */
export const UPSTREAM_FLOWS = {
  home: {
    path: '/',
    description: 'Public landing page with app version footer',
    specFile: 'specs/upstream/home.spec.ts',
  },
  login: {
    path: '/login',
    description: 'Login hub with auth method options',
    specFile: 'specs/upstream/login.spec.ts',
  },
  anonymousAuth: {
    path: '/login',
    description: 'Anonymous login → app dashboard journey',
    specFile: 'specs/upstream/auth-anonymous.spec.ts',
  },
  appDashboard: {
    path: '/app',
    description: 'Authenticated main dashboard',
    specFile: 'specs/upstream/app-dashboard.spec.ts',
  },
  appUnauthorized: {
    path: '/app',
    description: 'Unauthenticated visit shows UnauthorizedPage',
    specFile: 'specs/upstream/app-unauthorized.spec.ts',
  },
  profile: {
    path: '/app/profile',
    description: 'User profile and account settings',
    specFile: 'specs/upstream/profile.spec.ts',
  },
} as const;

export type UpstreamFlowKey = keyof typeof UPSTREAM_FLOWS;
