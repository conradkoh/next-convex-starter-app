# @workspace/sdk

Shared SDK scaffolding for mobile and web clients.

## Scripts

- build: TypeScript build to `dist/`
- typecheck: TS type checking without emit
- clean: remove build output

## Usage

Import from `@workspace/sdk` after adding exports to `src/index.ts`.

```ts
import { getVersion } from "@workspace/sdk";
```

## Notes

- Linted with Biome at repo root via pre-commit.
- Included in Nx as `@workspace/sdk` with build/typecheck/lint targets.
- Included in root typecheck and CI.
