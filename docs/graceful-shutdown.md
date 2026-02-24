# Graceful Shutdown Guide

> **Note**: This guide was originally written for NX's continuous tasks feature. The project now uses **Turbo** for task orchestration, which handles process management differently.

## Current Setup

This project uses Turbo for monorepo task management. The dev command is configured in `turbo.json` and `package.json`:

```json
{
  "scripts": {
    "dev": "turbo run dev"
  }
}
```

## Process Management with Turbo

Turbo runs tasks and caches outputs. For long-running dev servers:

1. **Start dev servers**: `pnpm dev`
2. **Stop with Ctrl+C**: Turbo will terminate running tasks

## Port Conflicts

If you encounter port conflicts after stopping:

```bash
# Find and kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Or for all node processes
pkill -f "node|next|convex"
```

## References

- [Turbo Documentation](https://turbo.build/repo/docs)
- [Node.js Process Signals](https://nodejs.org/api/process.html#process_signal_events)
