---
mode: agent
---

# `/rulesalign`

The `/rulesalign` command keeps every instruction surface in this repo
consistent so that tooling guidance, automation contracts, and command
references stay identical wherever an agent reads them.

The instruction surfaces in this project are:

- `AGENTS.md` — the top-level development guide (entry point for agents).
- `.github/instructions/` — canonical core/backend/frontend instructions
  (`core.instructions.md`, `backend.instructions.md`, `frontend.instructions.md`).
- `.github/prompts/` — slash-command prompts (for example `/check`, `/cleanup`,
  `/commit`, `/review`, `/rulesalign`).

## When to Run

- Initiating or reviewing changes to any instruction files under
  `.github/instructions/` or `.github/prompts/`, or to `AGENTS.md`.
- Adding, renaming, or deprecating commands referenced by automation
  (for example `/cleanup`, `/commit`).
- After structural refactors that change file paths or terminology referenced
  by the instructions.

## Preconditions

1. **Branch preparation**: Work on a dedicated branch with a clean git status
   before starting alignment.
2. **Context gathering**: Review `AGENTS.md`, the relevant
   `.github/instructions/*.md`, and every instruction file that will change.
3. **Tool surface audit**: Confirm the set of instruction surfaces above still
   matches the repository; note any new surface that has been added.

## Alignment Workflow

1. **Inventory**
   - List every instruction artifact across `AGENTS.md`,
     `.github/instructions/`, and `.github/prompts/`.
   - Note any owners or last-updated metadata if present.
2. **Validate Structure**
   - Compare instructions against the current project layout.
   - Record discrepancies (missing sections, outdated file paths, stale
     terminology) in a scratch log.
3. **Normalize Guidance**
   - Draft a canonical summary of the desired rules, commands, and terminology.
   - **For core instructions**: Treat `.github/instructions/*.md` as the source
     of truth.
   - **For commands**: Treat the matching `.github/prompts/*.prompt.md` as the
     source of truth.
   - Resolve conflicts by prioritizing: 1) `.github/instructions/` for core
     instructions, 2) `.github/prompts/` for command behavior, 3) `AGENTS.md`
     for the high-level summary.
4. **Apply Updates**
   - Update `.github/instructions/` and `.github/prompts/` first, then reconcile
     the summary in `AGENTS.md`.
   - Keep section ordering and terminology identical across surfaces.

## Outputs & Verification

- ✅ All instruction files edited during the session share synchronized content
  and normative language.
- ✅ Command behavior described in `.github/prompts/` matches the core
  instructions in `.github/instructions/` and the summary in `AGENTS.md`.
- ✅ A concise alignment summary (changelog or pull-request notes) captures what
  changed and why.

## Post-Run Follow-Ups

- Notify collaborators who maintain automation or CI that consumes the updated
  instructions. Track pending work in standard project tracking (issue or PR).
- Re-run `/rulesalign` after substantial structural refactors or when a new
  instruction surface is introduced.

## Escalation Triggers

- **MUST stop** and request guidance if conflicting policies cannot be
  reconciled from the available sources.
- **MAY defer** low-risk cosmetic differences (formatting-only) but must log
  them as follow-ups if left unresolved.
