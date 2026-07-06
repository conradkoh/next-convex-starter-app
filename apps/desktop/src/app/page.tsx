export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">Desktop App</h1>
      <p className="max-w-md text-balance text-sm text-neutral-600 dark:text-neutral-400">
        Next.js static export packaged as a native macOS app. Run{' '}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-900">
          pnpm build:macos
        </code>{' '}
        to build a local `.dmg`.
      </p>
    </main>
  );
}
