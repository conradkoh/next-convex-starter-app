# Nub.js Tooling Evaluation

**Generated:** 2026-06-19  
**Scope:** Research and migration planning only. This document does not migrate the repository to Nub.js.

## Executive recommendation

Adopt Nub.js in two stages:

1. **Low-risk toolchain acceleration first:** use `nub run`, `nubx`, `nub <file>`, and `nub watch` while keeping pnpm as the package manager. This replaces the expensive wrappers around existing tools without changing dependency resolution or lockfile ownership.
2. **Evaluate package-manager replacement second:** only after smoke tests pass, evaluate `nub install` against the existing `pnpm-lock.yaml` v9. Do not switch to Nub identity (`nub pm use nub`) in the first migration.

The strongest immediate fit for this repository is replacing the webapp's Bun icon-generation path. The riskiest area is replacing pnpm itself, because this repo intentionally uses pnpm supply-chain controls such as `minimumReleaseAge`, `minimumReleaseAgeStrict`, `onlyBuiltDependencies`, and `allowBuilds`.

## Current repository tooling inventory

| Area                     | Current repo state                                                 | Evidence                                                                            |
| ------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Package manager          | pnpm 11.1.2                                                        | `package.json` line 5                                                               |
| Lockfile                 | `pnpm-lock.yaml` v9                                                | `pnpm-lock.yaml` line 1                                                             |
| Workspace layout         | `apps/*` and `services/*`                                          | `pnpm-workspace.yaml` lines 1-3                                                     |
| pnpm supply-chain policy | 24-hour minimum release age, strict mode, explicit build allowlist | `pnpm-workspace.yaml` lines 5-14 and `package.json` lines 52-60                     |
| Monorepo runner          | Turbo at root                                                      | `package.json` lines 8-21 and `turbo.json` lines 1-57                               |
| Frontend                 | Next.js 16.2.3 with Turbopack                                      | `apps/webapp/package.json` lines 5-15 and 45-53                                     |
| Frontend icon generator  | Bun script plus `bun` devDependency                                | `apps/webapp/package.json` lines 14-15 and 69                                       |
| Backend                  | Convex, TypeScript build, Vitest                                   | `services/backend/package.json` lines 6-12                                          |
| Tests                    | Vitest unit tests and Playwright e2e                               | `apps/webapp/package.json` lines 10-13; `services/backend/package.json` lines 10-12 |
| Quality tooling          | ESLint, Prettier, lint-staged, Husky, Fallow                       | `package.json` lines 12-22; `lint-staged.config.mjs` lines 9-18                     |
| Node pin                 | No `.node-version`, `.nvmrc`, or `engines.node` found              | Repository scan                                                                     |
| CI workflows             | No `.github/workflows` files found                                 | Repository scan                                                                     |

## What Nub.js can replace

| Current tool or pattern                     | Nub replacement                 | Fit         | Notes                                                                                                                                                   |
| ------------------------------------------- | ------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run ...`                              | `nub run ...`                   | High        | Nub documents pnpm-run compatibility, lifecycle hooks, workspace recursion, filters, and `npm_*` env injection.                                         |
| `pnpm exec ...` / `npx ...`                 | `nubx ...` or `nub exec ...`    | High        | Nub resolves local `node_modules/.bin` first and falls back to registry fetch like `npx` / `pnpm dlx`.                                                  |
| `bun run scripts/generate-icons.ts`         | `nub scripts/generate-icons.ts` | High        | Nub runs TypeScript directly on stock Node and respects `tsconfig.json`.                                                                                |
| `dotenv-cli -e .env.local -- ...`           | Native Nub `.env*` loading      | Medium      | Nub loads `.env`, `.env.local`, and `NODE_ENV`-specific files before Node starts. Next.js also loads `.env.local`, so validate no env precedence drift. |
| `tsx`, `ts-node`, ad-hoc loaders            | `nub <file>`                    | Medium      | Not currently used directly in this repo, but relevant for scripts and tooling.                                                                         |
| `nodemon`, `tsx watch`, glob-based watchers | `nub watch <file>`              | Medium      | Nub watches the resolved dependency graph plus `.env*`, `tsconfig.json`, and `package.json`.                                                            |
| `nvm`, `fnm`, `mise`                        | `nub node`                      | Medium      | Useful only after adding a repo-level Node pin such as `.node-version` or `engines.node`.                                                               |
| pnpm package manager                        | `nub install`                   | Conditional | Supported for pnpm v9 lockfiles, but must be validated against this repo's pnpm-specific config and security policy.                                    |
| Corepack                                    | `nub pm`                        | Conditional | Nub can provision the pinned pnpm version without Corepack, but this is only useful after deciding whether pnpm remains the declared package manager.   |

## What Nub.js should not replace yet

Nub does not replace the application frameworks or test tools currently in use:

- Next.js and Turbopack remain responsible for the webapp build/dev server.
- Convex remains responsible for backend functions, migrations, and deployment.
- Turbo remains the monorepo task runner unless a later evaluation proves Nub should own task orchestration directly.
- Vitest remains the unit test runner.
- Playwright remains the e2e runner.
- ESLint, Prettier, lint-staged, Husky, and Fallow remain quality tools.

## Nub.js documentation findings

Key documentation reviewed:

- [Nub introduction](https://nubjs.com/docs): all-in-one Rust toolkit for Node.js; runs on stock Node, not a new runtime.
- [Runtime](https://nubjs.com/docs/runtime): TypeScript/JSX execution, `tsconfig` resolution, `.env*` loading, loaders, modern globals, and `--node` escape hatch.
- [Script runner](https://nubjs.com/docs/run): `nub run` as a pnpm-run-compatible workspace script runner.
- [Package runner](https://nubjs.com/docs/nubx): `nubx` / `nub exec` as an `npx` / `pnpm dlx` replacement.
- [Package manager](https://nubjs.com/docs/install): pnpm/npm/Bun lockfile compatibility and install behavior.
- [pnpm compatibility](https://nubjs.com/docs/install/pnpm): pnpm v9 lockfile read/write, pnpm config support, and unsupported surfaces.
- [Bun compatibility](https://nubjs.com/docs/install/bun): Bun text lockfile support and gaps.
- [Node manager](https://nubjs.com/docs/node): `.node-version` / `.nvmrc` / `engines.node` based Node provisioning.
- [Watch mode](https://nubjs.com/docs/watch): dependency-graph-based restart behavior.
- [GitHub Action](https://nubjs.com/docs/setup-nub): `nubjs/setup-nub` as a `setup-node` replacement.
- [FAQ](https://nubjs.com/docs/faq): runtime boundaries, package-manager replacement, and stop-using-Nub behavior.

Important compatibility points for this repo:

- The repo's `pnpm-lock.yaml` is already v9, which matches Nub's supported pnpm lockfile format.
- Nub's pnpm mode supports `pnpm-workspace.yaml`, `package.json#pnpm`, `onlyBuiltDependencies`, `allowBuilds`, `.npmrc`, and pnpm config.
- Nub's pnpm page says `pnpm deploy` is not wired; this repo does not currently use `pnpm deploy`, but it is a future watch item.
- Nub's Bun support reads `bun.lock` text files, but this repo only uses Bun as a script runner/devDependency, not as the package manager.
- Nub intentionally does not add Nub-specific APIs to application code, so rollback is mostly a tooling-script rollback.

## Proposed migration path

### Phase 0: Keep current behavior as the baseline

Do not change package-manager identity yet. Keep:

- `packageManager: "pnpm@11.1.2+sha512..."`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- pnpm supply-chain settings
- Turbo root scripts

This keeps rollback simple and avoids changing dependency resolution before Nub is smoke-tested.

### Phase 1: Install Nub locally and smoke-test pnpm compatibility

Local-only commands:

```bash
npm install -g --ignore-scripts=false @nubjs/nub
nub --version
nub install --frozen-lockfile
git diff --exit-code -- package.json pnpm-lock.yaml pnpm-workspace.yaml
```

Expected result:

- `nub install --frozen-lockfile` succeeds.
- `pnpm-lock.yaml` remains `lockfileVersion: '9.0'`.
- No tracked package-manager files change.

Follow-up checks:

```bash
pnpm install --frozen-lockfile
nub run typecheck
nub run test
```

If `nub install` changes the lockfile or `pnpm install --frozen-lockfile` fails afterward, stop the migration and keep Nub limited to script/bin/file running.

### Phase 2: Replace pnpm-run wrappers first

Keep script bodies unchanged, but replace the wrapper in developer docs and local usage:

```bash
nub run dev
nub run typecheck
nub run test
nub run e2e
nub run -r --filter @workspace/webapp test
nub run -r --filter @workspace/backend typecheck
```

Rationale:

- This is the lowest-risk win because Nub only dispatches existing scripts.
- Turbo, Next, Convex, Vitest, Playwright, ESLint, Prettier, and Fallow remain unchanged.
- The repo can compare `pnpm run ...` vs `nub run ...` locally before changing committed scripts.

### Phase 3: Replace the Bun icon-generation path

Current scripts:

```json
{
  "generate:icons": "bun run scripts/generate-icons.ts",
  "generate:icons:all": "bun run scripts/generate-icons.ts --favicon"
}
```

Candidate replacement:

```json
{
  "generate:icons": "nub scripts/generate-icons.ts",
  "generate:icons:all": "nub scripts/generate-icons.ts --favicon"
}
```

Then remove the `bun` devDependency if smoke tests pass:

```bash
pnpm remove --filter @workspace/webapp bun
```

Validation:

```bash
nub run --filter @workspace/webapp generate:icons
nub run --filter @workspace/webapp generate:icons:all
git status --short
```

Notes:

- `apps/webapp/scripts/generate-icons.ts` currently has `#!/usr/bin/env bun`. Since the migration would invoke the file through Nub, the shebang can be revisited separately.
- Keep `sharp` and `png-to-ico` dependencies because the script still uses them.

### Phase 4: Remove `dotenv-cli` only after env precedence validation

Current script:

```json
{
  "dev": "dotenv -e .env.local -- next dev"
}
```

Candidate replacement after validation:

```json
{
  "dev": "next dev"
}
```

Run through:

```bash
nub run --filter @workspace/webapp dev
pnpm run --filter @workspace/webapp dev
```

Validation checklist:

- `.env.local` is loaded in the same order.
- `NEXT_PUBLIC_CONVEX_URL` is available to Next.
- No secret from `.env.local` leaks into test runs.
- Existing manual setup docs still work.

### Phase 5: Add a Node pin before adopting `nub node`

The repo currently documents "Node.js 22 or later" but does not pin an exact version. Before relying on `nub node`, add a repo-level pin, for example:

- `.node-version` with an exact LTS patch, or
- `package.json#engines.node` plus a matching `.node-version`.

Then validate:

```bash
nub node which
nub node install
nub run typecheck
```

Avoid adding `nub node` before the pin exists because Nub falls back to whatever Node is on `PATH`, which weakens reproducibility.

### Phase 6: Evaluate `nub install` as the package manager

Only start this phase after Phases 1-3 pass.

Candidate developer workflow:

```bash
nub install --frozen-lockfile
nub add -D --save-catalog <package>
nub update
nub dedupe --check
```

Keep pnpm as the rollback tool during evaluation:

```bash
pnpm install --frozen-lockfile
```

Do not run `nub pm use nub` in the first package-manager evaluation because Nub identity changes the config surface and can stop reading pnpm-branded config.

### Phase 7: Add CI support only if workflows exist

No `.github/workflows` files are present in this repository scan. If workflows are added later, the Nub docs suggest replacing `actions/setup-node` with `nubjs/setup-nub`.

Before changing CI:

- Confirm the correct action tag from the current Nub docs/repo.
- Decide whether CI should keep `setup-node` and only use Nub for scripts, or fully switch setup to Nub.
- Validate caching behavior with `pnpm-lock.yaml`.
- Keep a rollback workflow or branch until the first successful CI run.

## Acceptance criteria for the first implementation PR

The first PR that adopts Nub should be considered safe only if all of the following pass:

- `nub install --frozen-lockfile` succeeds without tracked lockfile changes.
- `pnpm install --frozen-lockfile` still succeeds after `nub install`.
- `nub run typecheck` succeeds.
- `nub run test` succeeds.
- `nub run --filter @workspace/webapp generate:icons` succeeds.
- `git diff` contains only intentional script/documentation/package changes.
- `pnpm-lock.yaml` remains v9.
- No runtime application code changes are required.

## Risks and mitigations

| Risk                                                   | Impact | Mitigation                                                                                                                |
| ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Nub changes dependency resolution subtly               | High   | Keep pnpm identity, run `nub install --frozen-lockfile`, then verify `pnpm install --frozen-lockfile` still passes.       |
| pnpm supply-chain policy is not mirrored exactly       | High   | Keep `minimumReleaseAge`, `onlyBuiltDependencies`, and `allowBuilds`; compare Nub install warnings against pnpm behavior. |
| `.env*` loading order differs from `dotenv-cli` / Next | Medium | Validate `.env.local`, `NEXT_PUBLIC_CONVEX_URL`, and test env behavior before removing `dotenv-cli`.                      |
| Bun script shebang creates confusion                   | Low    | Invoke scripts with `nub scripts/generate-icons.ts`; update shebang only if direct execution is needed.                   |
| CI action tag drifts                                   | Medium | Confirm current `nubjs/setup-nub` tag before adding workflows.                                                            |
| No exact Node pin exists                               | Medium | Add `.node-version` or `engines.node` before relying on `nub node`.                                                       |

## Recommended first PR shape

A first implementation PR should be intentionally narrow:

1. Add this evaluation document.
2. Add developer docs for installing Nub locally.
3. Replace the Bun icon-generation scripts with Nub file-runner scripts.
4. Remove the `bun` devDependency from `apps/webapp/package.json`.
5. Leave pnpm as the package manager and leave Turbo scripts unchanged.

This gives the user a visible, reviewable migration slice without switching package-manager identity or changing the lockfile format.

## Rollback plan

Because the recommended first PR keeps pnpm as the package manager, rollback is straightforward:

```bash
git revert <nub-adoption-commit>
pnpm install --frozen-lockfile
pnpm run --filter @workspace/webapp generate:icons
```

If a later PR switches to `nub install`, rollback should first restore pnpm as the declared package manager and verify the pnpm v9 lockfile before reverting scripts.

## Open questions

1. Should the repo keep pnpm as the long-term package manager and use Nub only for script/bin/file execution?
2. If switching package managers is desired, should the target be pnpm-owned `nub install` compatibility or full Nub identity?
3. What exact Node version should be pinned in `.node-version`?
4. Should the icon-generation script shebang be changed, or should the script only be invoked through Nub?
5. If CI workflows are added, should they use `nubjs/setup-nub` directly or keep `actions/setup-node` for now?
