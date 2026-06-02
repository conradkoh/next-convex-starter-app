# Fallow Baseline

This document records the initial fallow findings when the tool replaced knip. Downstream projects should use these findings as a reference to understand which files/dependencies are intentionally unused and should not be fixed in one pass.

**Baseline generated:** 2026-06-03

## Machine-readable baseline

Committed at [`.fallow/baseline.json`](../../../.fallow/baseline.json). `pnpm find-deadcode` compares against it and only fails when **new** dead-code issues are introduced.

To refresh the baseline after intentional cleanup:

```bash
pnpm exec fallow dead-code --save-baseline .fallow/baseline.json
```

## Unused files (8)

These files exist but are not reachable from any entry point. They may be placeholders, deprecated code, or loaded only via configuration.

```
apps/webapp/src/components/DateRangePicker.tsx
apps/webapp/src/components/ThemeToggle.tsx
apps/webapp/src/components/ui/alert.tsx
apps/webapp/src/components/ui/collapsible.tsx
apps/webapp/src/components/ui/fixed-size-dialog.mdx
apps/webapp/src/components/ui/fixed-size-dialog.tsx
apps/webapp/src/modules/checklist/checklist-empty-state.tsx
apps/webapp/src/test-utils.tsx
```

## Scripts

| Script             | Command                                             | Purpose                                        |
| ------------------ | --------------------------------------------------- | ---------------------------------------------- |
| `find-deadcode`    | `fallow dead-code --baseline .fallow/baseline.json` | Dead code + deps; fails only on regressions    |
| `code-quality`     | `fallow`                                            | Full analysis: dead code, duplication, health  |
| `code-quality:fix` | `fallow fix --dry-run`                              | Preview automatic cleanup of dead exports/deps |

## Configuration

- [`.fallowrc.jsonc`](../../../.fallowrc.jsonc) — migrated from `knip.jsonc`
- `ignoreDependencies`: `husky`, `lint-staged` (dev tooling, not imported in app code)

Fallow auto-discovers workspace packages from `pnpm-workspace.yaml` (`apps/*`, `services/*`).

## Notes

- Exit code 0 from `pnpm find-deadcode` means no **new** issues vs the baseline.
- Run `pnpm code-quality` for duplication (`dupes`) and complexity (`health`) checks that knip did not provide.
- Unresolved imports in `services/backend/convex/_generated/` are from Convex-generated files and may be expected.
