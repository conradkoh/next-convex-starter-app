---
applyTo: "**"
---

# General Project Guidelines

This document provides general project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes across all parts of the project.

## Package Manager

We use **pnpm** as our package manager. This is a pnpm workspace with multiple packages.

### Main packages:

- `apps/webapp` - frontend project
- `services/backend` - backend project

## Code Quality & Linting

We use **Biome** for checking lints. This can be run from the root of the repo with `pnpm run lint`.

**Important:**

- ❌ AVOID running linting with the `next lint` command
- ❌ AVOID running linting with `eslint`

### Code Cleanup

The code can be improved by following the cleanup routine in [cleanup-improve-code-quality.md](../../guides/routines/cleanup-improve-code-quality.md)

## Date Information

We might not always get the current date and time. The system knows best.

If you need information on the current date and time, run the command:

```bash
date +%Y-%m-%d\ %H:%M:%S
```
