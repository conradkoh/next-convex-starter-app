---
applyTo: "**"
---

# Backend Development Guidelines

This document provides backend-specific context and coding guidelines for the Convex backend located in `services/backend`.

## Authentication Conventions

### Backend Authentication

All Convex backend queries, mutations, and actions that require authentication must use `SessionIdArg` from convex-helpers:

```ts
import { SessionIdArg } from "convex-helpers/server/sessions";

export const myQuery = query({
  args: {
    ...SessionIdArg,
    // other args
  },
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

<directive>
  <core>Require SessionIdArg for any authenticated backend functions.</core>
  <why>Ensures consistent auth handling and prevents unauthenticated access.</why>
  <scope>Convex queries, mutations, and actions.</scope>
</directive>

### Auth Provider

The application uses the `AuthProvider` component to provide authentication state to the entire app.

<note>
  <context>Frontend provides session via AuthProvider; backend expects SessionIdArg.</context>
</note>

## Feature Flags

Feature flags for the app are configured in [featureFlags.ts](../../services/backend/config/featureFlags.ts).

<verify>
  <check>Are new flags added with safe defaults (off/false)?</check>
  <check>Are flag reads centralized and typed?</check>
  <check>Is there a migration or fallback path when removing a flag?</check>
</verify>
