# Next.js Conventions

This document records the Next.js conventions we consistently apply in this project. It serves as a reference for maintainers to ensure consistency.

## App Router

We use the Next.js App Router (`app/` directory) for routing.

- Routes are defined by folder structure under `apps/webapp/src/app/`
- Each route segment gets its own folder with a `page.tsx` (or `page.mdx`)
- Layouts, loading states, and error boundaries co-locate with their route segments

### `params` is a Promise

When accessing route parameters in page components, `params` is a Promise and must be awaited:

```tsx
export default async function MyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

## `loading.tsx`

Loading boundaries provide skeleton UI during navigation between routes.

- Place `loading.tsx` next to `page.tsx` in any route segment
- Export a default component that renders `Skeleton` placeholders
- **Must be a server component** — do not add `'use client'`
- Mimic the page layout structure for a smooth visual transition

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="...">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}
```

## Error boundaries

Error handling has one convention document:
[error-handling.md](./error-handling.md). The files that exist:

- `apps/webapp/src/app/global-error.tsx` — replaces the root layout on a root-level crash; renders its own `<html>`/`<body>` and uses `AppUnavailable`.
- `apps/webapp/src/app/error.tsx` — catches any page or segment failure under the root layout and delegates to `RouteError` with scope `route:root`.
- `apps/webapp/src/app/app/admin/error.tsx` — keeps the admin layout; `RouteError` with scope `route:admin`, home `/app` and label "Back to app".
- `apps/webapp/src/app/app/system-admin/error.tsx` — same for scope `route:system-admin`.
- `apps/webapp/src/app/not-found.tsx` — one neutral panel for `notFound()` and unmatched routes.
- `apps/webapp/src/app/layout.tsx` — three `ErrorBoundary` scopes: `app-providers` (→ `AppUnavailable`), `navigation` (→ `NavigationFallback`) and `install-banner` (→ `null`).

Rules:

- `error.tsx` **must be a client component** (`'use client'`) and delegate to `RouteError` with a `scope`. Do not re-implement the panel.
- `reset()` runs only from a user action. `RouteError` calls `router.refresh()` first when `error.digest` is set, then `reset()`.
- Server layouts pass **element** fallbacks only, because functions cannot cross the server/client boundary. Client files may pass a render function and use `useErrorBoundaryState()` for the caught error.
- `not-found.tsx` is a server component.
- Add a new boundary only for a self-contained widget whose failure should not take down the page. See [error-handling.md](./error-handling.md#adding-a-region-boundary).

See [error-handling.md](./error-handling.md) for the contract, copy rules, and the full boundary map.

## Link Component

Use the built-in Next.js `Link` component for client-side navigation.

- Import from `next/link`
- Use for internal navigations to benefit from prefetching and SPA-like transitions
- Do NOT use `<a>` tags for internal routes

```tsx
import Link from 'next/link';

<Link href="/app/profile">Profile</Link>;
```
