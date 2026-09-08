# Session activity projection

Web-session last-activity timestamps are high-frequency writes (heartbeats,
device reports). Writing them into the `sessions` row on every heartbeat
invalidates every query that reads that row. To keep small updates small, the
latest activity timestamp is stored in a dedicated `sessionActivity`
projection table (one row per session), while the `sessions` row keeps a
compatibility mirror.

## Tables

- `sessionActivity` (`services/backend/convex/schema.ts`): `{ sessionId:
Id<'sessions'>, lastActivityAt: number }`, indexed by `by_sessionId`. This
  is the preferred read source when a row is present.
- `sessions.lastActivityAt`: retained as the migration/rolling-deploy
  compatibility mirror. It is dual-written on every activity update and is the
  read fallback while projection rows may be missing.

## Contracts

- **Dual writes.** Every activity writer patches `sessions.lastActivityAt`
  **and** calls `upsertSessionActivity` in the same mutation
  (`updateSessionActivity`, `updateSessionDeviceInfo` in
  `services/backend/convex/sessions.ts`). All activity writers must update
  both values.
- **Max-wins writes.** Activity writes are max-wins for both
  `sessions.lastActivityAt` and `sessionActivity`: each writer first resolves
  the effective timestamp as the max of the stored legacy value and the
  incoming timestamp, then patches the mirror and calls
  `upsertSessionActivity` with that effective value. A delayed older write
  therefore cannot regress either store, and it cannot seed a projection row
  with a timestamp lower than the legacy mirror during deploy-before-migrate.
- **Reconciling reads.** `listMySessions` resolves each session's activity as
  the newer defined value of the projection and legacy timestamps (explicit
  `undefined` handling with `Math.max` when both are defined), returning
  `undefined` only when both are absent. `createdAt` remains sort-only and is
  never returned as `lastActivityAt`. Never fall back directly to `createdAt`
  when a legacy activity value exists.
- **Deletes clean up.** `logout` (`auth.ts`), `revokeSession`, and
  `revokeAllOtherSessions` (`sessions.ts`) call `deleteSessionActivity`
  alongside deleting the parent session. Deletion is idempotent, so deletes
  never fail when the backfill has not run. All helpers live in the single
  module `services/backend/convex/sessionActivity.ts`; do not duplicate the
  max-wins/deletion logic elsewhere.

## Rollout sequence (deploy-before-migrate is safe)

Production deploys backend code before running migrations, so the new code is
live while `sessionActivity` rows are incomplete or absent. This is safe by
construction:

1. Deploy the additive schema/code change (new table, dual writes,
   projection-first reads with legacy fallback).
2. Run `pnpm migrate` (from the repo root), which executes `runAll` including
   the idempotent `backfillSessionActivity` migration. It creates a projection
   row only when `session.lastActivityAt` is defined, repairs an existing row
   only when the legacy value is newer, and returns no session patch. Safe to
   re-run.
3. Keep the legacy mirror and fallback in place. Migration failure must not
   make session activity disappear, because reads still use the mirror.

Do not add a projection-complete flag or a projection-only cutover: the
fallback makes the rollout safe without a second deployment, and the legacy
field must not be removed in the same change.

## Limitation: legacy-mirror invalidation

Retaining the legacy `sessions.lastActivityAt` mirror means any consumer that
still reads `sessions` rows remains invalidated by its writes. The projection
reduces invalidation only for consumers that read the projection alone (or
after a coordinated cutover to projection-only reads).

## Note for downstream projects

This is a reusable starter pattern for generic web sessions. Existing
downstream projects do not update automatically; they must sync/adopt this
pattern (projection table, dual writes, fallback reads, backfill) themselves.
