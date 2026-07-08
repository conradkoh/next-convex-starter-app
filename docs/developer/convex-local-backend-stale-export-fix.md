# Convex Local Backend: Stale Export Fix

## Problem

When upgrading the local Convex backend (e.g. via `npx convex dev`), the upgrade process fails with:

```
Error fetching POST http://127.0.0.1:3210/api/export/request/zip?includeStorage=true 400 Bad Request: ExportInProgress: There is already an export requested or in progress.
```

This happens when a previous upgrade attempt crashed mid-export, leaving the export state stuck in a non-terminal state (`Requested` or `InProgress`). The state persists across backend restarts because it's stored in SQLite and never auto-cleaned for non-terminal states.

## Repo Information

- **Repository**: [get-convex/convex-backend](https://github.com/get-convex/convex-backend)
- **Branch used for analysis**: `main` (cloned at commit 3461a926)
- **Local clone path**: `/tmp/convex-backend`

## Error Trace

### 1. CLI triggers upgrade

**File**: `npm-packages/convex/src/cli/lib/localDeployment/upgrade.ts`

The upgrade flow starts the old backend, then calls `startSnapshotExport()` to export data before switching versions:

```ts
const snapshotExportState = await startSnapshotExport(ctx, {
  deploymentUrl,
  adminKey,
  includeStorage: true,
  inputPath: exportPath,
});
```

### 2. CLI POSTs to the backend API

**File**: `npm-packages/convex/src/cli/lib/convexExport.ts` (line ~167)

```ts
await fetch(`/api/export/request/zip?includeStorage=${args.includeStorage}`, { method: 'POST' });
```

### 3. HTTP handler receives the request

**File**: `crates/local_backend/src/snapshot_export.rs`

```rust
pub async fn request_zip_export(
    MtState(st): MtState,
    ...
) -> Result<StatusCode> {
    st.application.request_export(...).await?;
    Ok(StatusCode::OK)
}
```

### 4. Application layer checks for existing exports

**File**: `crates/application/src/lib.rs` (line ~1590–1620)

This is where the error originates:

```rust
let export_requested = exports_model.latest_requested().await?;
let export_in_progress = exports_model.latest_in_progress().await?;

match (export_requested, export_in_progress) {
    (None, None) => {
        // OK — no existing export, insert new one
        exports_model.insert_requested(...).await
    },
    _ => Err(
        anyhow::anyhow!("Can only have one export requested or in progress at once")
            .context(ErrorMetadata::bad_request(
                "ExportInProgress",
                "There is already an export requested or in progress.",
            )),
    ),
}?;
```

### 5. DB query against the `_exports` system table

**File**: `crates/model/src/exports/mod.rs`

The state check queries via index `by_state_and_ts`:

```rust
async fn export_in_state(&mut self, export_state: &str) -> ... {
    self.tx.query_system(TableNamespace::Global, &*EXPORTS_BY_STATE_AND_TS_INDEX)?
        .eq(&[export_state])?
        .unique()
        .await?
}
```

### 6. Export state machine

**File**: `crates/model/src/exports/types.rs`

Valid transitions:

| State        | Transitions to                          |
| ------------ | --------------------------------------- |
| `Requested`  | → `InProgress`, → `Canceled`            |
| `InProgress` | → `Completed`, → `Failed`, → `Canceled` |
| `Completed`  | terminal                                |
| `Failed`     | terminal                                |
| `Canceled`   | terminal                                |

**The bug**: Non-terminal states (`Requested`, `InProgress`) are never cleaned up. Only `Completed`, `Failed`, and `Canceled` entries get deleted by the retention cleanup logic. A crashed export leaves a permanent blocker.

## How to Fix: Clear Stale Exports via SQLite

### Locate the database

```
services/backend/.convex/local/default/convex_local_backend.sqlite3
```

### Inspect current exports

```bash
sqlite3 services/backend/.convex/local/default/convex_local_backend.sqlite3 \
  "SELECT id, state, start_ts, expiration_ts FROM _exports;"
```

This shows all export records. Look for rows where `state` is `requested` or `in_progress`.

### Delete stale (non-terminal) exports

```bash
sqlite3 services/backend/.convex/local/default/convex_local_backend.sqlite3 \
  "DELETE FROM _exports WHERE state IN ('requested', 'in_progress');"
```

This removes only stuck non-terminal entries. Terminal states (`completed`, `failed`, `canceled`) are left alone since they're already cleaned up by retention or can be safely ignored.

### Verify the fix

```bash
sqlite3 services/backend/.convex/local/default/convex_local_backend.sqlite3 \
  "SELECT id, state FROM _exports;"
```

No rows with `requested` or `in_progress` should remain. Then run `pnpm dev` again — the upgrade/export will proceed normally.

### Alternative: Delete all exports (nuclear option)

If you don't care about preserving any export history:

```bash
sqlite3 services/backend/.convex/local/default/convex_local_backend.sqlite3 \
  "DELETE FROM _exports;"
```

## Prevention

The root cause is that the upgrade process doesn't clean up stale exports before attempting a new one. A fix in `upgrade.ts` could cancel any existing export before calling `startSnapshotExport()`:

```ts
// Before startSnapshotExport, cancel any pending export:
const existingExports = await listExports(deploymentUrl, adminKey);
for (const exp of existingExports) {
  if (exp.state === 'requested' || exp.state === 'in_progress') {
    await cancelExport(deploymentUrl, adminKey, exp.id);
  }
}
```

This would require exposing a `list_exports` and `cancel_export` endpoint to the CLI.
