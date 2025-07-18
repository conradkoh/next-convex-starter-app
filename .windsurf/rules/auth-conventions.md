---
trigger: model_decision
description: Idimomatic way to implement auth for this project with examples for both backend and frontend
globs: 
---
# Authentication Conventions

## Backend Authentication
- All Convex backend queries, mutations, and actions that require authentication must use `SessionIdArg` from convex-helpers:
```ts
import { SessionIdArg } from 'convex-helpers/server/sessions';

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

## Frontend Authentication
- Use the session helpers from convex-helpers to automatically handle session ID:
  - `useSessionQuery` instead of `useQuery`
  - `useSessionMutation` instead of `useMutation`
  - `useSessionAction` instead of `useAction`

Example:
```tsx
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';

// In your component:
const authState = useSessionQuery(api.auth.getState);
const updateName = useSessionMutation(api.auth.updateUserName);
```

## Auth Provider
- The application uses the `AuthProvider` component to provide authentication state to the entire app
